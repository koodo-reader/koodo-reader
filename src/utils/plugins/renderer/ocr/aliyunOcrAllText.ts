import type { OCRPlugin } from "../../types";
import { recognizeWithAliyun } from "./aliyunOcrCommon";

export const recognize: OCRPlugin = async (imageBase64, axios, config) =>
  recognizeWithAliyun(
    "RecognizeAllText",
    { Type: String(config.ocrType || "General") },
    imageBase64,
    axios,
    config
  );
