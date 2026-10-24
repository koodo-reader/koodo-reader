import type { OCRPlugin } from "../../types";
import {
  base64ToUint8Array,
  parseImageBase64,
  throwOcrRequestError,
} from "./common";

interface AzureOcrWord {
  text?: string;
}

interface AzureOcrLine {
  words?: AzureOcrWord[];
}

interface AzureOcrRegion {
  lines?: AzureOcrLine[];
}

export const recognize: OCRPlugin = async (imageBase64, axios, config) => {
  const endpoint = (config.endpoint || "").replace(/\/+$/, "");
  const apiKey = config.apiKey || "";
  const language = config.language || "unk";

  if (!endpoint || !apiKey) {
    throw new Error("Missing Azure Computer Vision endpoint or apiKey");
  }

  try {
    const { base64 } = parseImageBase64(imageBase64);
    const bytes = base64ToUint8Array(base64);
    const url =
      `${endpoint}/vision/v3.2/ocr` +
      `?language=${encodeURIComponent(String(language))}` +
      `&detectOrientation=true&model-version=latest`;

    const res = await axios.post(url, bytes, {
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/octet-stream",
      },
    });

    if (res.data?.error) {
      throw new Error(
        res.data.error.message || "Azure Computer Vision OCR request failed"
      );
    }

    const regions: AzureOcrRegion[] = Array.isArray(res.data?.regions)
      ? res.data.regions
      : [];
    const lines: string[] = [];
    regions.forEach((region) => {
      const regionLines = Array.isArray(region?.lines) ? region.lines : [];
      regionLines.forEach((line) => {
        const words = Array.isArray(line?.words) ? line.words : [];
        const text = words
          .map((word) => String(word?.text || ""))
          .join(" ")
          .trim();
        if (text) {
          lines.push(text);
        }
      });
    });
    return lines;
  } catch (error) {
    throwOcrRequestError(error);
  }
};
