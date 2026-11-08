// SPDX-License-Identifier: MIT

/**
 * The Worker that runs one synchronous WASM operation. It receives a single
 * `run` message from `internal/run.mjs`, reads its inputs synchronously,
 * posts each output chunk, flush, and progress report back in order, and
 * finishes with one `done` message.
 *
 * The control block is a shared `Int32Array`: CANCEL is set by the caller,
 * ACKS counts output chunks the caller's sink has taken, and READ_STATE /
 * READ_COUNT answer reads that the caller serves from its own thread.
 */

import { FORMATS } from "../io.mjs";

const CANCEL = 0;
const ACKS = 1;
const READ_STATE = 2;
const READ_COUNT = 3;
/** Output chunks that may wait for the caller's sink before Rust pauses. */
const WINDOW = 8;

const node = typeof process !== "undefined" && process.versions?.node != null;

let post;
if (node) {
  const { parentPort } = await import("node:worker_threads");
  post = (message, transfer) => parentPort.postMessage(message, transfer);
  parentPort.once("message", (message) => start(message));
} else {
  post = (message, transfer) => self.postMessage(message, transfer ?? []);
  self.addEventListener("message", (event) => start(event.data), { once: true });
}

/**
 * Run the operation and always answer with one `done` message, sent only
 * after every input is closed: an OPFS file is free again once the caller
 * settles.
 */
async function start(message) {
  const closers = [];
  let outcome;
  try {
    outcome = await run(message, closers);
  } catch (error) {
    outcome = { failure: { name: error?.name ?? "Error", message: String(error?.message ?? error) } };
  }
  for (const close of closers) {
    try {
      close();
    } catch {}
  }
  post({ type: "done", ...outcome });
}

/** A synchronous reader `(offset, view) => count` for one input. */
async function openReader(input, resource, control, data, closers) {
  switch (input.kind) {
    case "blob": {
      const reader = new FileReaderSync();
      return (offset, view) => {
        const buffer = reader.readAsArrayBuffer(input.blob.slice(offset, offset + view.byteLength));
        view.set(new Uint8Array(buffer));
        return buffer.byteLength;
      };
    }
    case "opfs": {
      const access = await input.handle.createSyncAccessHandle();
      closers.push(() => access.close());
      return (offset, view) => access.read(view, { at: offset });
    }
    case "path":
    case "fd": {
      const fs = await import("node:fs");
      let fd = input.fd;
      if (input.kind === "path") {
        fd = fs.openSync(input.path, "r");
        closers.push(() => fs.closeSync(fd));
      }
      return (offset, view) => fs.readSync(fd, view, 0, view.byteLength, offset);
    }
    case "served": {
      // The caller reads the range on its own thread into `data`.
      return (offset, view) => {
        Atomics.store(control, READ_STATE, 0);
        post({ type: "read", resource, offset, length: view.byteLength });
        while (Atomics.load(control, READ_STATE) === 0) {
          Atomics.wait(control, READ_STATE, 0);
        }
        const count = Atomics.load(control, READ_COUNT);
        if (count < 0 || count > view.byteLength) throw new Error("the caller could not read the input");
        view.set(data.subarray(0, count));
        return count;
      };
    }
    default:
      throw new TypeError(`unsupported input kind: ${input.kind}`);
  }
}

async function run({ operation, module, inputs, fonts, config, control, data }, closers) {
  const shared = control == null ? null : new Int32Array(control);
  const served = data == null ? null : new Uint8Array(data);
  const readers = [];
  for (const [resource, input] of inputs.entries()) {
    readers.push(await openReader(input, resource, shared, served, closers));
  }
  let memory;
  let posted = 0;
  let hostFailure;
  const imports = {
    caj2pdf: {
      caj2pdf_read(resource, offset, pointer, length) {
        try {
          return readers[resource](offset, new Uint8Array(memory.buffer, pointer, length));
        } catch (error) {
          hostFailure ??= { name: error?.name ?? "Error", message: String(error?.message ?? error) };
          return -1;
        }
      },
      caj2pdf_write(pointer, length) {
        // A copy, so Rust may reuse its buffer at once.
        const bytes = new Uint8Array(memory.buffer, pointer, length).slice();
        post({ type: "write", bytes }, [bytes.buffer]);
        posted += 1;
        if (shared != null) {
          for (;;) {
            const acked = Atomics.load(shared, ACKS);
            if (((posted - acked) | 0) <= WINDOW || Atomics.load(shared, CANCEL) !== 0) break;
            Atomics.wait(shared, ACKS, acked);
          }
        }
        return length;
      },
      caj2pdf_flush() {
        post({ type: "flush" });
        return 0;
      },
      caj2pdf_progress(done, total) {
        post({ type: "progress", done, total });
      },
      caj2pdf_cancelled() {
        return shared == null ? 0 : Atomics.load(shared, CANCEL);
      },
    },
  };
  const exports = (await WebAssembly.instantiate(module, imports)).exports;
  memory = exports.memory;
  if (fonts != null) {
    for (const [index, face] of fonts.faces.entries()) {
      if (exports.caj2pdf_c8_add_font(BigInt(inputs[index + 1].size), face) !== index + 1) {
        return { invalid: "WASM rejected a C8 font resource" };
      }
    }
    const roles = fonts.symbols === undefined
      ? exports.caj2pdf_c8_set_fonts(...fonts.roles)
      : exports.caj2pdf_c8_set_fonts_with_symbols(...fonts.roles, fonts.symbols);
    if (roles !== 1) return { invalid: "WASM rejected C8 font roles" };
    for (const state of [3, 28, 31]) {
      const index = fonts[`latinState${state}`];
      if (index !== undefined && exports.caj2pdf_c8_set_latin_state(state, index) !== 1) {
        return { invalid: `WASM rejected the state-${state} Latin font role` };
      }
    }
  }
  const { size, chunkSize, format, flags, limits } = config;
  const status = operation === "convert"
    ? exports.caj2pdf_convert(BigInt(size), chunkSize, format, flags, limits.maxInputBytes, limits.maxOutputBytes, limits.maxAllocationBytes, limits.maxPages, limits.maxBookmarks)
    : exports.caj2pdf_inspect(BigInt(size), chunkSize, format, limits.maxInputBytes, limits.maxOutputBytes, limits.maxAllocationBytes, limits.maxPages, limits.maxBookmarks);
  if (status === 2 || status === 3) return { invalid: "invalid WASM operation configuration" };
  const formatCode = exports.caj2pdf_format();
  if (status !== 0) {
    const message = new TextDecoder().decode(
      new Uint8Array(memory.buffer, exports.caj2pdf_message_ptr(), exports.caj2pdf_message_len()),
    );
    return { error: { kind: exports.caj2pdf_error_kind(), message, format: formatCode }, hostFailure };
  }
  return { result: operation === "convert" ? report(exports, formatCode) : inspection(exports, formatCode, memory) };
}

function report(exports, format) {
  return {
    format,
    inputBytesRead: exports.caj2pdf_input_bytes_read(),
    outputBytesWritten: exports.caj2pdf_output_bytes_written(),
    pagesConverted: exports.caj2pdf_pages_converted(),
    substitutedGlyphs: exports.caj2pdf_substituted_glyphs(),
    bookmarksWritten: exports.caj2pdf_bookmarks_written(),
    omittedPages: Array.from({ length: exports.caj2pdf_omitted_pages_count() }, (_, index) => ({
      pageIndex: exports.caj2pdf_omitted_page_index(index),
      offset: exports.caj2pdf_omitted_page_offset(index),
    })),
    outlineWarnings: exports.caj2pdf_outline_warnings(),
    outlineOmitted: exports.caj2pdf_outline_omitted() !== 0,
  };
}

function applicationText(exports, memory, field) {
  const length = exports.caj2pdf_info_text_len(field);
  if (length === 0) return null;
  return new TextDecoder().decode(new Uint8Array(memory.buffer, exports.caj2pdf_info_text_ptr(field), length));
}

function inspection(exports, format, memory) {
  const bookmarks = exports.caj2pdf_info_bookmark_count();
  const notes = exports.caj2pdf_info_note_count();
  return {
    format,
    pageCount: FORMATS[format] === "caa" ? null : exports.caj2pdf_info_page_count(),
    bookmarkCount: bookmarks < 0n ? null : Number(bookmarks),
    outlineWarnings: exports.caj2pdf_outline_warnings(),
    applicationInfo: notes < 0n
      ? null
      : { doi: applicationText(exports, memory, 0), url: applicationText(exports, memory, 1), noteCount: Number(notes) },
    inputBytesRead: exports.caj2pdf_input_bytes_read(),
  };
}
