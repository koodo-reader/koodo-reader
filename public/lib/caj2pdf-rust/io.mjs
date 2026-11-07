// SPDX-License-Identifier: MIT

/**
 * Platform-neutral constants, errors, and sink and stream helpers shared by
 * the Node.js and browser entry points. A conversion runs in a Worker that
 * reads its input synchronously; output reaches a caller-side sink
 * `{ writeChunk(bytes, signal), flush(signal) }` in order.
 */
export const DEFAULT_IO_CHUNK = 256 * 1024;
export const MAX_IO_CHUNK = 1024 * 1024;
export const MAX_U64 = (1n << 64n) - 1n;
/** Largest `maxAllocationBytes` accepted inside 32-bit WASM memory. */
export const MAX_ALLOCATION_LIMIT = 256n * 1024n * 1024n;
/** Core defaults; `maxInputBytes` also bounds temporary spools by default. */
export const DEFAULT_LIMITS = Object.freeze({
  maxInputBytes: 8n * 1024n ** 3n,
  maxOutputBytes: 16n * 1024n ** 3n,
  maxAllocationBytes: 64n * 1024n * 1024n,
  maxPages: 100_000,
  maxBookmarks: 100_000,
});

/**
 * Format names in WASM code order. `pdf`, `caj`, `kdh`, `hn` and `c8`
 * convert; `teb`, `nh` and `caa` are rejected with `UnsupportedFormatError`.
 */
export const FORMATS = Object.freeze(["auto", "pdf", "caj", "kdh", "hn", "c8", "teb", "nh", "caa"]);

/** A typed conversion failure. `code` is one of the stable error codes. */
export class Caj2PdfError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "Caj2PdfError";
    this.code = code;
  }
}

/** A recognized-but-unconverted (`format` set) or unrecognized input. */
export class UnsupportedFormatError extends Caj2PdfError {
  constructor(format) {
    super(
      format == null
        ? "input is not a recognized PDF, CAJ, KDH, HN, C8, TEB or CAA format"
        : format === "teb"
          ? "TEB input is a DRM-encrypted CNKI container; its document content is encrypted and cannot be converted"
          : format === "caa"
            ? "CAA input is a target descriptor, not a document; obtain the referenced document and convert that file"
            : `${format.toUpperCase()} input is recognized, but converting it is not supported yet`,
      "UNSUPPORTED_FORMAT",
    );
    this.name = "UnsupportedFormatError";
    this.format = format;
  }
}

export class TruncatedInputError extends Caj2PdfError {
  constructor(message) {
    super(message, "TRUNCATED_INPUT");
    this.name = "TruncatedInputError";
  }
}

export function requireU64(value, name) {
  if (typeof value !== "bigint" || value < 0n || value > MAX_U64) {
    throw new RangeError(`${name} must be a nonnegative unsigned 64-bit BigInt`);
  }
  return value;
}

export function requireChunkLength(length, { allowZero = false } = {}) {
  if (!Number.isSafeInteger(length) || length < (allowZero ? 0 : 1) || length > MAX_IO_CHUNK) {
    throw new RangeError(`chunk length must be ${allowZero ? "0" : "1"}..${MAX_IO_CHUNK}`);
  }
  return length;
}

function abortReason(signal) {
  return signal.reason ?? new DOMException("Operation cancelled", "AbortError");
}

export function checkAbort(signal) {
  if (signal?.aborted) {
    throw abortReason(signal);
  }
}

/**
 * Settle with `promise`, or reject as soon as `signal` aborts. An abandoned
 * operation may still finish, so it must only touch buffers it owns.
 */
export function abortable(promise, signal) {
  if (signal == null) return promise;
  checkAbort(signal);
  let onAbort;
  const aborted = new Promise((_, reject) => {
    onAbort = () => reject(abortReason(signal));
    signal.addEventListener("abort", onAbort, { once: true });
  });
  return Promise.race([promise, aborted]).finally(() => {
    signal.removeEventListener("abort", onAbort);
  });
}

export function requireSinkChunk(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError("writeChunk requires Uint8Array");
  }
  requireChunkLength(bytes.byteLength, { allowZero: true });
}

/** Adapt a caller-owned WritableStreamDefaultWriter without closing it. */
export function webWritableSink(writer) {
  if (writer == null || typeof writer.write !== "function") {
    throw new TypeError("a WritableStream writer is required");
  }
  return Object.freeze({
    async writeChunk(bytes, signal) {
      requireSinkChunk(bytes);
      await abortable(writer.write(bytes), signal);
      return bytes.byteLength;
    },
    async flush(signal) {
      if (writer.ready != null) {
        await abortable(writer.ready, signal);
      }
    },
  });
}

/**
 * Feed a Web `ReadableStream`, Node `Readable`, or async iterable of
 * Uint8Array chunks to `consume`, awaiting each call. Rejects once more than
 * `maxBytes` arrive and cancels the stream on any failure. An acquired Web
 * reader is released on every outcome.
 */
export async function pumpChunks(stream, consume, { maxBytes, signal } = {}) {
  requireU64(maxBytes, "maxBytes");
  let next;
  let stop;
  let release;
  if (typeof stream?.getReader === "function") {
    const reader = stream.getReader();
    next = () => reader.read();
    stop = () => reader.cancel();
    release = () => reader.releaseLock();
  } else if (typeof stream?.[Symbol.asyncIterator] === "function") {
    const iterator = stream[Symbol.asyncIterator]();
    next = () => iterator.next();
    stop = () => iterator.return?.();
  } else {
    throw new TypeError("a ReadableStream, Node Readable, or async iterable is required");
  }
  let total = 0n;
  let failed = false;
  try {
    for (;;) {
      const { done, value } = await abortable(next(), signal);
      if (done) return total;
      if (!(value instanceof Uint8Array)) {
        throw new TypeError("stream chunks must be Uint8Array or Buffer");
      }
      total += BigInt(value.byteLength);
      if (total > maxBytes) {
        throw new Caj2PdfError(`temporary spool limit of ${maxBytes} bytes exceeded`, "LIMIT_EXCEEDED");
      }
      await abortable(consume(value), signal);
    }
  } catch (error) {
    failed = true;
    // Initiate cancellation while we still own the reader. Do not await a
    // stalled producer or let cleanup replace the primary failure.
    try {
      Promise.resolve(stop()).catch(() => {});
    } catch {}
    throw error;
  } finally {
    try {
      release?.();
    } catch (error) {
      if (!failed) throw error;
    }
  }
}
