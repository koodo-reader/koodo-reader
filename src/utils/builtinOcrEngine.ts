declare var window: any;

// tesseract / paddle 引擎的宿主侧识别实现，通过 externalWorker 注入 kookit，
// kookit 不再内置任何 OCR 库、模型 URL 或缓存逻辑（breaking change 自 kookit 新版起）
// 注意：模型/WASM 全部手动 fetch 后以 ArrayBuffer 传入引擎，避免 ort 内部
// 在 Worker/主线程里二次 fetch 造成的挂死；所有请求带超时兜底，防止进度条永久卡死
const OCR_CORE_VERSIONS = {
  tesseractCore: "https://unpkg.com/tesseract.js-core@6.1.2",
  tessdata: "https://tessdata.projectnaptha.com/4.0.0_best",
  onnxruntime: "https://unpkg.com/onnxruntime-web@1.23.2/dist/",
};

const INIT_TIMEOUT_MS = 120000;
const RECOG_TIMEOUT_MS = 300000;

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

const fetchWithTimeout = async (url: string, ms: number) => {
  const response = await withTimeout(fetch(url), ms, `fetch ${url}`);
  if (!response.ok) {
    throw new Error(`fetch ${url} failed: ${response.status}`);
  }
  return response;
};

const getStorageDomain = (serverRegion: string) =>
  serverRegion === "china"
    ? "storage.koodoreader.cn"
    : "storage.koodoreader.com";

const tesseractWorkerCache: Record<string, Promise<any>> = {};
const paddleWorkerCache: Record<string, Promise<any>> = {};

const getTesseractWorker = (ocrLang: string, isElectronEnv: boolean) => {
  const cacheKey = ocrLang || "chi_sim";
  if (!tesseractWorkerCache[cacheKey]) {
    tesseractWorkerCache[cacheKey] = withTimeout(
      (async () => {
        const workerScript = await (
          await fetchWithTimeout(
            `${isElectronEnv ? "." : ""}/lib/tesseractjs/worker.min.js`,
            INIT_TIMEOUT_MS
          )
        ).text();
        const workerUrl = URL.createObjectURL(
          new Blob([workerScript], { type: "application/javascript" })
        );
        const worker = await window.Tesseract.createWorker([cacheKey], 1, {
          workerPath: workerUrl,
          corePath: OCR_CORE_VERSIONS.tesseractCore,
          langPath: OCR_CORE_VERSIONS.tessdata,
        });
        await worker.load();
        return worker;
      })(),
      INIT_TIMEOUT_MS,
      "tesseract worker init"
    );
    // 初始化失败时清除缓存，允许下次重新创建
    tesseractWorkerCache[cacheKey].catch(() => {
      delete tesseractWorkerCache[cacheKey];
    });
  }
  return tesseractWorkerCache[cacheKey];
};

const getPaddleWorker = (ocrLang: string, serverRegion: string) => {
  const lang = ocrLang || "standard_v5_mobile";
  const cacheKey = `${lang}|${serverRegion}`;
  if (!paddleWorkerCache[cacheKey]) {
    paddleWorkerCache[cacheKey] = withTimeout(
      (async () => {
        const domain = getStorageDomain(serverRegion);
        const [dictStr, detBuffer, recBuffer] = await Promise.all([
          (
            await fetchWithTimeout(
              `https://${domain}/paddleocr/models/${lang}/${lang}_dict.txt`,
              INIT_TIMEOUT_MS
            )
          ).text(),
          (
            await fetchWithTimeout(
              `https://${domain}/paddleocr/models/${lang}/${lang}_det.onnx`,
              INIT_TIMEOUT_MS
            )
          ).arrayBuffer(),
          (
            await fetchWithTimeout(
              `https://${domain}/paddleocr/models/${lang}/${lang}_rec.onnx`,
              INIT_TIMEOUT_MS
            )
          ).arrayBuffer(),
        ]);
        // 设置 WASM 文件路径（必须！）并启用 Proxy Worker（自动 offload 到后台 Worker）
        window.ort.env.wasm.wasmPaths = OCR_CORE_VERSIONS.onnxruntime;
        window.ort.env.wasm.proxy = true;
        const localOCR: any = await window["esearch-ocr"].init({
          det: {
            // 传入 ArrayBuffer 而不是 URL，绕开 ort 内部 fetch，避免 Worker 内二次请求挂死
            input: detBuffer,
            ratio: 0.75,
          },
          rec: {
            input: recBuffer,
            decodeDic: dictStr, // 需要传入字典内容而不是路径
          },
          ort: window.ort,
          ortOption: {
            executionProviders: [{ name: "webgpu" }, { name: "wasm" }],
          },
        });
        return localOCR;
      })(),
      INIT_TIMEOUT_MS,
      "paddle engine init"
    );
    // 初始化失败时清除缓存，允许下次重新创建
    paddleWorkerCache[cacheKey].catch(() => {
      delete paddleWorkerCache[cacheKey];
    });
  }
  return paddleWorkerCache[cacheKey];
};

/**
 * 为内置 OCR 引擎（tesseract/paddle）构造 externalWorker，
 * 契约与 kookit 的 externalWorker 一致：
 * recognize(imageDataURL) => Promise<string>，返回纯文本
 * （kookit 侧会统一做结果解析与 CJK 空格清理）
 */
export const getBuiltinEngineOcrWorker = (
  engine: "tesseract" | "paddle",
  ocrLang: string,
  serverRegion: string,
  isElectronEnv: boolean
) => ({
  recognize: async (imageURL: string) => {
    if (engine === "tesseract") {
      const worker = await getTesseractWorker(ocrLang, isElectronEnv);
      const result: any = await withTimeout(
        worker.recognize(imageURL),
        RECOG_TIMEOUT_MS,
        "tesseract recognize"
      );
      return (result && result.data && result.data.text) || "";
    } else if (engine === "paddle") {
      const localOCR = await getPaddleWorker(ocrLang, serverRegion);
      // kookit 侧保证 externalWorker 的调用是串行的（preProcessNextChapters 逐章等待）
      const result: any = await withTimeout(
        localOCR.ocr(imageURL),
        RECOG_TIMEOUT_MS,
        "paddle recognize"
      );
      return ((result && result.parragraphs) || [])
        .map((p: any) => p.text)
        .join("\n");
    }
    throw new Error(`Unsupported builtin OCR engine: ${engine}`);
  },
});
