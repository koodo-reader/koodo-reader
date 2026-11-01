// SPDX-License-Identifier: MIT

/**
 * Caller-side driver: validates options, starts one Worker per operation,
 * delivers its output to the caller's sink in order, serves reads the Worker
 * cannot perform itself, and settles after the final flush.
 */
import {
  Caj2PdfError,
  DEFAULT_IO_CHUNK,
  DEFAULT_LIMITS,
  FORMATS,
  MAX_ALLOCATION_LIMIT,
  TruncatedInputError,
  UnsupportedFormatError,
  checkAbort,
  requireChunkLength,
  requireU64,
} from "../io.mjs";

const MAX_U32 = 0xffff_ffff;
const CANCEL = 0;
const ACKS = 1;
const READ_STATE = 2;
const READ_COUNT = 3;
/** How long a cancelled Worker may take to reach a checkpoint before it is terminated. */
const STOP_TIMEOUT_MS = 10_000;

const ERROR_CODES = [
  "UNKNOWN",
  "UNSUPPORTED_FORMAT",
  "INVALID_INPUT",
  "TRUNCATED_INPUT",
  "LIMIT_EXCEEDED",
  "IO",
  "CANCELLED",
  "RANDOM_ACCESS_REQUIRED",
  "MALFORMED_PDF",
  "ENCRYPTED_PDF",
  "UNSUPPORTED_PDF_FEATURE",
  "AMBIGUOUS_PDF_REPAIR",
  "PDF_LIMIT_EXCEEDED",
  "MALFORMED_CAJ",
  "CAJ_LIMIT_EXCEEDED",
  "MALFORMED_KDH",
  "HNC8",
];

function toU64(value, name) {
  return requireU64(Number.isSafeInteger(value) ? BigInt(value) : value, name);
}

function toU32(value, name) {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_U32) {
    throw new RangeError(`${name} must be an integer 0..${MAX_U32}`);
  }
  return value;
}

function resolveLimits(limits, chunkSize) {
  if (limits == null || typeof limits !== "object") {
    throw new TypeError("limits must be an object");
  }
  const merged = { ...DEFAULT_LIMITS };
  for (const [name, value] of Object.entries(limits)) {
    // An explicit `undefined` keeps the default, as for other options.
    if (value !== undefined) merged[name] = value;
  }
  const resolved = {
    maxInputBytes: toU64(merged.maxInputBytes, "limits.maxInputBytes"),
    maxOutputBytes: toU64(merged.maxOutputBytes, "limits.maxOutputBytes"),
    maxAllocationBytes: toU64(merged.maxAllocationBytes, "limits.maxAllocationBytes"),
    maxPages: toU32(merged.maxPages, "limits.maxPages"),
    maxBookmarks: toU32(merged.maxBookmarks, "limits.maxBookmarks"),
  };
  if (
    resolved.maxAllocationBytes > MAX_ALLOCATION_LIMIT ||
    resolved.maxAllocationBytes < BigInt(chunkSize)
  ) {
    throw new RangeError(`limits.maxAllocationBytes must be chunkSize..${MAX_ALLOCATION_LIMIT}`);
  }
  return resolved;
}

function formatCode(format) {
  const code = FORMATS.indexOf(format);
  if (code < 0) {
    throw new RangeError(`format must be one of: ${FORMATS.join(", ")}`);
  }
  return code;
}

/** Validate conversion and inspection options without side effects. */
export function operationConfig(options) {
  const {
    format = "auto",
    limits = {},
    chunkSize = DEFAULT_IO_CHUNK,
    signal,
    includeBookmarks = true,
    allowDamaged = false,
    progress,
  } = options ?? {};
  if (typeof allowDamaged !== "boolean") {
    throw new TypeError("allowDamaged must be a boolean");
  }
  if (progress !== undefined && typeof progress !== "function") {
    throw new TypeError("progress must be a function");
  }
  requireChunkLength(chunkSize);
  return {
    format: formatCode(format),
    limits: resolveLimits(limits, chunkSize),
    chunkSize,
    signal,
    flags: (includeBookmarks ? 1 : 0) | (allowDamaged ? 2 : 0),
    progress,
  };
}

export function requireSink(sink) {
  if (sink == null || typeof sink.writeChunk !== "function" || typeof sink.flush !== "function") {
    throw new TypeError("sink must expose writeChunk() and flush()");
  }
}

function requireModule(wasm) {
  if (!(wasm instanceof WebAssembly.Module)) {
    throw new TypeError("a compiled caj2pdf WebAssembly.Module (from loadModule()) is required");
  }
}

/**
 * Collect the explicit C8 font roles. A role is an input, or
 * `{ source, face }` for one face of a collection; equal inputs and faces
 * share one resource.
 */
function fontConfig(options) {
  if (options?.fonts === undefined) return undefined;
  const { cjk, latin, alternateLatin, decoration, symbols, latinState3, latinState28, latinState31 } = options.fonts ?? {};
  const sources = [];
  const faces = [];
  const index = (font) => {
    const { source, face = 0 } = font != null && typeof font === "object" && "source" in font ? font : { source: font };
    if (source == null) throw new TypeError("a font source is required");
    if (!Number.isInteger(face) || face < 0 || face > MAX_U32) throw new RangeError("font face must be an unsigned 32-bit integer");
    let id = sources.findIndex((known, at) => known === source && faces[at] === face);
    if (id < 0) {
      id = sources.length;
      sources.push(source);
      faces.push(face);
    }
    return id;
  };
  // An absent optional role (0xffffffff) uses the core CJK/Latin fallback.
  const roles = [index(cjk), index(latin), alternateLatin === undefined ? MAX_U32 : index(alternateLatin)];
  if (decoration === undefined) {
    roles.push(MAX_U32, 0);
  } else {
    const character = decoration?.character;
    if (typeof character !== "string" || [...character].length !== 1 || character.codePointAt(0) > 0xffff || (character.charCodeAt(0) >= 0xd800 && character.charCodeAt(0) <= 0xdfff)) {
      throw new TypeError("decoration character must be one BMP Unicode scalar");
    }
    roles.push(index(decoration.source), character.codePointAt(0));
  }
  const optional = (font) => (font === undefined ? undefined : index(font));
  const fonts = {
    roles,
    symbols: optional(symbols),
    latinState3: optional(latinState3),
    latinState28: optional(latinState28),
    latinState31: optional(latinState31),
  };
  if (sources.length > 8) throw new RangeError("at most eight distinct C8 font resources are supported");
  return { sources, faces, fonts };
}

function failureError(failure) {
  const error = new Error(failure.message);
  error.name = failure.name;
  return error;
}

function engineError(error, hostFailure) {
  // A failed read ends the operation, whatever context the core adds to it.
  if (hostFailure != null) return failureError(hostFailure);
  const code = ERROR_CODES[error.kind] ?? "UNKNOWN";
  if (code === "UNSUPPORTED_FORMAT") {
    return new UnsupportedFormatError(error.format === 0 ? null : FORMATS[error.format]);
  }
  const message = error.message || `conversion failed: ${code}`;
  return code === "TRUNCATED_INPUT" ? new TruncatedInputError(message) : new Caj2PdfError(message, code);
}

function named(result) {
  return { ...result, format: result.format === 0 ? null : FORMATS[result.format] };
}

/**
 * Run `operation` ("convert" or "inspect") in a fresh Worker. `platform`
 * supplies `createWorker()`, `describe(input, role)` and
 * `read(input, offset, length)` for inputs the Worker cannot read itself.
 */
export async function runOperation(platform, operation, wasm, source, sink, options = {}) {
  requireModule(wasm);
  if (operation === "convert") requireSink(sink);
  const config = operationConfig(options);
  const fontSetup = operation === "convert" ? fontConfig(options?.hnc8) : undefined;
  const { signal } = config;
  checkAbort(signal);
  const inputs = [await platform.describe(source, "source")];
  for (const font of fontSetup?.sources ?? []) {
    const input = await platform.describe(font, "font");
    if (input.size === 0) throw new RangeError("font source must not be empty");
    inputs.push(input);
  }
  checkAbort(signal);
  const sharedMemory = typeof SharedArrayBuffer === "function" && globalThis.crossOriginIsolated !== false;
  const servedInputs = inputs.filter((input) => input.kind === "served");
  if (servedInputs.length !== 0 && !sharedMemory) {
    throw new Caj2PdfError("this input needs SharedArrayBuffer to be read from a Worker", "RANDOM_ACCESS_REQUIRED");
  }
  const control = sharedMemory ? new SharedArrayBuffer(4 * 4) : null;
  const data = servedInputs.length !== 0 ? new SharedArrayBuffer(config.chunkSize) : null;
  const shared = control == null ? null : new Int32Array(control);
  const worker = await platform.createWorker();
  return new Promise((resolve, reject) => {
    let settled = false;
    let finished = false;
    let failure;
    let callerFailure;
    let stopTimer;
    let queue = Promise.resolve();

    const answerRead = (count) => {
      Atomics.store(shared, READ_COUNT, count);
      Atomics.store(shared, READ_STATE, 1);
      Atomics.notify(shared, READ_STATE);
    };
    const cleanup = () => {
      signal?.removeEventListener("abort", onAbort);
    };
    // Reject once the Worker has stopped and closed its inputs.
    const release = () => {
      if (stopTimer !== undefined) clearTimeout(stopTimer);
      worker.terminate();
      reject(failure);
    };
    const fail = (error) => {
      if (settled) return;
      settled = true;
      failure = error;
      cleanup();
      if (shared == null || finished) {
        // Without shared memory the Worker cannot see cancellation; stop it.
        release();
        return;
      }
      // The Worker stops at its next checkpoint; a stalled write or a read
      // waiting on this thread is woken and fails.
      Atomics.store(shared, CANCEL, 1);
      Atomics.notify(shared, ACKS);
      answerRead(-1);
      stopTimer = setTimeout(release, STOP_TIMEOUT_MS);
      stopTimer.unref?.();
    };
    const onAbort = () => fail(signal.reason ?? new DOMException("Operation cancelled", "AbortError"));
    signal?.addEventListener("abort", onAbort, { once: true });

    const handle = async (message) => {
      switch (message.type) {
        case "write": {
          const { bytes } = message;
          let offset = 0;
          while (offset < bytes.byteLength && !settled) {
            const part = offset === 0 ? bytes : bytes.subarray(offset);
            const accepted = await sink.writeChunk(part, signal);
            if (!Number.isSafeInteger(accepted) || accepted <= 0 || accepted > part.byteLength) {
              throw new RangeError("sink returned an invalid byte count");
            }
            offset += accepted;
          }
          if (shared != null) {
            Atomics.add(shared, ACKS, 1);
            Atomics.notify(shared, ACKS);
          }
          return;
        }
        case "flush":
          if (!settled) await sink.flush(signal);
          return;
        case "progress":
          if (!settled) config.progress?.(message.done / message.total);
          return;
        case "read": {
          let count = -1;
          // After a failure or abort, no more caller reads are made.
          if (!settled) {
            try {
              const bytes = await platform.read(inputs[message.resource], message.offset, message.length);
              if (!(bytes instanceof Uint8Array) || bytes.byteLength > message.length) {
                throw new TypeError("an input returned an invalid chunk");
              }
              new Uint8Array(data).set(bytes);
              count = bytes.byteLength;
            } catch (error) {
              callerFailure ??= error;
            }
          }
          answerRead(count);
          return;
        }
        case "done": {
          finished = true;
          // The Worker stopped before this queued message was reached.
          if (settled) return release();
          worker.terminate();
          if (message.failure != null) throw failureError(message.failure);
          if (message.invalid != null) throw new RangeError(message.invalid);
          if (message.error != null) {
            if (callerFailure != null) throw callerFailure;
            throw engineError(message.error, message.hostFailure);
          }
          settled = true;
          cleanup();
          resolve(named(message.result));
          return;
        }
        default:
          throw new Error(`unexpected Worker message: ${message.type}`);
      }
    };

    worker.onMessage((message) => {
      if (settled) {
        // Only the Worker's stop matters now; queued sink calls may never end.
        if (message.type === "read") answerRead(-1);
        if (message.type === "done" && !finished) {
          finished = true;
          release();
        }
        return;
      }
      // Messages are handled strictly in order; the sink sees one write at a time.
      queue = queue.then(() => handle(message)).catch((error) => {
        if (message.type === "done") finished = true;
        fail(error);
      });
    });
    worker.onError((error) => {
      if (settled) {
        if (!finished) {
          finished = true;
          release();
        }
        return;
      }
      finished = true;
      fail(error instanceof Error ? error : new Error(String(error?.message ?? error)));
    });
    worker.post({
      type: "run",
      operation,
      module: wasm,
      // A served input stays on this thread; the Worker only learns its size.
      inputs: inputs.map((input) => (input.kind === "served" ? { kind: "served", size: input.size } : input)),
      fonts: fontSetup == null ? null : { faces: fontSetup.faces, ...fontSetup.fonts },
      config: {
        size: inputs[0].size,
        chunkSize: config.chunkSize,
        format: config.format,
        flags: config.flags,
        limits: config.limits,
      },
      control,
      data,
    });
  });
}

/**
 * Spool a forward-only stream with a platform `spool` function, convert the
 * spooled copy with `convert`, and always dispose the temporary storage.
 */
export async function convertSpooledWith(convert, spool, wasm, stream, sink, options = {}) {
  // Reject a bad configuration before spooling up to gigabytes of input.
  requireModule(wasm);
  requireSink(sink);
  operationConfig(options);
  const maxBytes = toU64(
    options.maxSpoolBytes ?? options.limits?.maxInputBytes ?? DEFAULT_LIMITS.maxInputBytes,
    "maxSpoolBytes",
  );
  const spooled = await spool(stream, { maxBytes, signal: options.signal });
  let result;
  try {
    result = await convert(wasm, spooled.source, sink, options);
  } catch (error) {
    // A cleanup failure must not hide the conversion failure.
    await Promise.resolve().then(() => spooled.dispose()).catch(() => {});
    throw error;
  }
  await spooled.dispose();
  return result;
}
