// SPDX-License-Identifier: MIT

/**
 * Browser entry point: the shared API plus an Origin Private File System
 * spool. Each operation runs in a module Worker that reads a Blob/File with
 * `FileReaderSync`, or an OPFS file through a synchronous access handle.
 */
import { Caj2PdfError, pumpChunks, requireU64 } from "./io.mjs";
import { convertSpooledWith, runOperation } from "./internal/run.mjs";

export * from "./io.mjs";

/** Fetch and compile the packaged WASM module (or the one at `url`) once for reuse. */
export async function loadModule(url = new URL("./caj2pdf_wasm.wasm", import.meta.url)) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`could not fetch ${url}: HTTP ${response.status}`);
  }
  return WebAssembly.compileStreaming(response);
}

const platform = Object.freeze({
  async createWorker() {
    const worker = new Worker(new URL("./internal/worker.mjs", import.meta.url), { type: "module" });
    return {
      post: (message) => worker.postMessage(message),
      onMessage: (listener) => worker.addEventListener("message", (event) => listener(event.data)),
      onError: (listener) => {
        worker.addEventListener("error", (event) => {
          event.preventDefault?.();
          listener(event.error ?? new Error(event.message || "caj2pdf Worker failed"));
        });
        worker.addEventListener("messageerror", () => listener(new Error("a caj2pdf Worker message could not be read")));
      },
      terminate: () => worker.terminate(),
    };
  },
  async describe(input, role) {
    if (input instanceof Blob) {
      return { kind: "blob", blob: input, size: input.size };
    }
    if (input?.kind === "file" && typeof input.getFile === "function") {
      // An OPFS file; the Worker opens a synchronous access handle on it.
      return { kind: "opfs", handle: input, size: (await input.getFile()).size };
    }
    throw new TypeError(`${role} must be a Blob, a File, or an OPFS FileSystemFileHandle`);
  },
  async read() {
    throw new Error("browser inputs are read in the Worker");
  },
});

/**
 * Convert PDF, CAJ, KDH or HN/C8 to PDF. `source` is a Blob/File or an OPFS
 * `FileSystemFileHandle`; the format is detected from its leading signature
 * unless `format` is set.
 */
export function convert(wasm, source, sink, options = {}) {
  return runOperation(platform, "convert", wasm, source, sink, options);
}

/** Read format, pages and validated CAJ/HN-A bookmark counts. No image decoding. */
export function inspect(wasm, source, options = {}) {
  return runOperation(platform, "inspect", wasm, source, null, options);
}

/** Spool with `spool`, convert, and always dispose the spool. */
export function convertSpooled(spool, wasm, stream, sink, options = {}) {
  return convertSpooledWith(convert, spool, wasm, stream, sink, options);
}

/**
 * Copy a forward-only `ReadableStream` into a uniquely named OPFS file,
 * rejecting beyond `maxBytes`, and return its file handle as the source.
 * `dispose()` removes the file; failures and aborts remove it at once.
 * Rejects with `RANDOM_ACCESS_REQUIRED` when OPFS or `createWritable()` is
 * unavailable, rather than buffering the stream in memory.
 */
export async function spoolToOpfs(stream, { maxBytes, signal, storage = globalThis.navigator?.storage } = {}) {
  requireU64(maxBytes, "maxBytes");
  if (typeof storage?.getDirectory !== "function") {
    throw new Caj2PdfError(
      "no durable temporary storage (OPFS) is available; pass a Blob/File instead",
      "RANDOM_ACCESS_REQUIRED",
    );
  }
  const root = await storage.getDirectory();
  const name = `caj2pdf-spool-${crypto.randomUUID()}`;
  const file = await root.getFileHandle(name, { create: true });
  let writable;
  const dispose = async () => {
    // A browser may briefly retain the writer or access-handle lock after
    // abort settles. Bound retries to this specific lock error.
    for (let attempt = 0; ; attempt++) {
      try {
        await root.removeEntry(name);
        return;
      } catch (error) {
        if (error?.name !== "NoModificationAllowedError" || attempt === 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 10 : 50));
      }
    }
  };
  try {
    if (typeof file.createWritable !== "function") {
      throw new Caj2PdfError(
        "this browser cannot write OPFS files from this context; pass a Blob/File instead",
        "RANDOM_ACCESS_REQUIRED",
      );
    }
    writable = await file.createWritable();
    await pumpChunks(stream, (chunk) => writable.write(chunk), { maxBytes, signal });
    await writable.close();
    writable = undefined;
    return { source: file, dispose };
  } catch (error) {
    await Promise.resolve().then(() => writable?.abort()).catch(() => {});
    try {
      await dispose();
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], "OPFS spool failed and its temporary file could not be removed", { cause: error });
    }
    throw error;
  }
}

/**
 * Convert a forward-only `ReadableStream` through a bounded OPFS spool that
 * is removed on success, failure, or abort. `options.storage` overrides
 * `navigator.storage`.
 */
export function convertReadableStream(wasm, stream, sink, options = {}) {
  return convertSpooled(
    (input, spoolOptions) => spoolToOpfs(input, { ...spoolOptions, storage: options.storage }),
    wasm,
    stream,
    sink,
    options,
  );
}
