import type { OCRPlugin } from "../../types";
import { recognizeWithAliyun } from "./aliyunOcrCommon";

export const recognize: OCRPlugin = async (imageBase64, axios, config) =>
  recognizeWithAliyun("RecognizeAdvanced", {}, imageBase64, axios, config);
