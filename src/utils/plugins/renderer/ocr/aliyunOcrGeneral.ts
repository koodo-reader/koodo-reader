import type { OCRPlugin } from "../../types";
import { recognizeWithAliyun } from "./aliyunOcrCommon";

export const recognize: OCRPlugin = async (imageBase64, axios, config) =>
  recognizeWithAliyun("RecognizeGeneral", {}, imageBase64, axios, config);
