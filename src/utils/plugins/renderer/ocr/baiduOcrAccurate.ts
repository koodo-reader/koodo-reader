import type { OCRPlugin } from "../../types";
import { recognizeWithBaidu } from "./baiduOcrCommon";

const endpoint = "https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic";

export const recognize: OCRPlugin = async (imageBase64, axios, config) =>
  recognizeWithBaidu(endpoint, imageBase64, axios, config);
