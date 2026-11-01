import { isElectron } from "react-device-detect";

declare var window: any;

interface Caj2PdfSink {
  writeChunk(bytes: Uint8Array, signal?: AbortSignal): Promise<number>;
  flush(signal?: AbortSignal): Promise<void>;
}

interface Caj2PdfModule {
  convert(
    wasm: WebAssembly.Module,
    source: Blob,
    sink: Caj2PdfSink,
    options?: {
      format?: string;
      progress?: (fraction: number) => void;
    }
  ): Promise<{ format: string | null; pagesConverted: number }>;
}

// CAJ files are converted to PDF while importing, then handled by the regular
// PDF pipeline; nothing downstream ever sees the original extension.
export const isCajFormat = (extension: string) =>
  extension.toLowerCase() === "caj";

// The vendored caj2pdf-rust runtime is served as-is from public/lib and must
// never be processed by the bundler; its Worker and WASM sit next to it.
const runtimeUrl = (file: string) =>
  new URL(`lib/caj2pdf-rust/${file}`, document.baseURI).href;

// Metadata layout of the classic CAJ container: the outline-record count sits
// at 0x110 and the records themselves start at 0x114, 308 bytes each. Some
// CNKI exports store an unrelated page-index table in that region instead, so
// the count can name far more records than the file can possibly hold. The
// converter refuses the whole file in that case, while the outline it names
// does not exist; clearing the count lets the rest of the container convert.
const TOC_COUNT_OFFSET = 0x110;
const TOC_RECORDS_OFFSET = 0x114;
const TOC_RECORD_BYTES = 308;

const clearImpossibleOutlineCount = (input: ArrayBuffer) => {
  if (input.byteLength < TOC_RECORDS_OFFSET) return input;
  const header = new DataView(input);
  if (
    header.getUint8(0) !== 0x43 ||
    header.getUint8(1) !== 0x41 ||
    header.getUint8(2) !== 0x4a ||
    header.getUint8(3) !== 0x00
  ) {
    return input;
  }
  const count = header.getUint32(TOC_COUNT_OFFSET, true);
  if (TOC_RECORDS_OFFSET + count * TOC_RECORD_BYTES <= input.byteLength) {
    return input;
  }
  const repaired = input.slice(0);
  new DataView(repaired).setUint32(TOC_COUNT_OFFSET, 0, true);
  return repaired;
};

let entryPromise: Promise<Caj2PdfModule> | null = null;

const loadEntry = () => {
  if (!entryPromise) {
    entryPromise = import(/* webpackIgnore: true */ runtimeUrl("browser.mjs"))
      .then((entry) => entry as Caj2PdfModule)
      .catch((error) => {
        entryPromise = null;
        throw error;
      });
  }
  return entryPromise;
};

let wasmPromise: Promise<WebAssembly.Module> | null = null;

const loadWasm = () => {
  if (!wasmPromise) {
    wasmPromise = (async () => {
      // Electron loads the renderer from file://, where fetch() cannot read
      // local files, so the module is read through the main process. Dev
      // servers and the web build fetch it over http instead.
      if (isElectron && window.location.protocol === "file:") {
        const appRoot = window.electronAPI.sendSync("get-dirname", "ping");
        const wasmPath = window.electronAPI.path.join(
          appRoot,
          "build",
          "lib",
          "caj2pdf-rust",
          "caj2pdf_wasm.wasm"
        );
        const bytes = window.electronAPI.fs.readFileSync(wasmPath);
        return WebAssembly.compile(
          bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength
          )
        );
      }
      const response = await fetch(runtimeUrl("caj2pdf_wasm.wasm"));
      if (!response.ok) {
        throw new Error(`caj2pdf wasm not found: HTTP ${response.status}`);
      }
      return WebAssembly.compile(await response.arrayBuffer());
    })().catch((error) => {
      wasmPromise = null;
      throw error;
    });
  }
  return wasmPromise;
};

/**
 * Converts CAJ bytes to PDF with the vendored caj2pdf-rust WASM build. The
 * conversion runs in a Worker, so the UI stays responsive; the output is
 * collected in memory and returned as an ArrayBuffer.
 */
export const convertCajToPdf = async (
  input: ArrayBuffer,
  onProgress?: (fraction: number) => void
): Promise<ArrayBuffer> => {
  const [entry, wasm] = await Promise.all([loadEntry(), loadWasm()]);
  const chunks: Uint8Array[] = [];
  await entry.convert(
    wasm,
    new Blob([clearImpossibleOutlineCount(input)]),
    {
      async writeChunk(bytes) {
        chunks.push(bytes);
        return bytes.byteLength;
      },
      async flush() {},
    },
    {
      // The format is detected from the leading bytes, so a mislabeled file
      // fails cleanly instead of being converted as something it is not.
      format: "auto",
      progress: onProgress,
    }
  );
  let total = 0;
  for (const chunk of chunks) {
    total += chunk.byteLength;
  }
  const pdf = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    pdf.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return pdf.buffer;
};
