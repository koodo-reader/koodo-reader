import type { OCRPlugin } from "../../types";
import { recognizeWithTencent } from "./tencentOcrCommon";

export const recognize: OCRPlugin = async (imageBase64, axios, config) =>
  recognizeWithTencent("GeneralAccurateOCR", imageBase64, axios, config);
