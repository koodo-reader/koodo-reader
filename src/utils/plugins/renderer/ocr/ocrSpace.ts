import type { OCRPlugin } from "../../types";
import {
  normalizeOcrText,
  parseImageBase64,
  throwOcrRequestError,
} from "./common";

interface OcrSpaceParsedResult {
  ParsedText?: string;
}

export const recognize: OCRPlugin = async (imageBase64, axios, config) => {
  const apiKey = config.apiKey || "helloworld";
  const language = config.language || "eng";
  const ocrEngine = config.ocrEngine || "2";

  try {
    const { dataUrl } = parseImageBase64(imageBase64);
    const endpoint = (
      config.endpoint || "https://api.ocr.space/parse/image"
    ).replace(/\/+$/, "");

    const form = new FormData();
    form.append("base64Image", dataUrl);
    form.append("language", String(language));
    form.append("OCREngine", String(ocrEngine));
    form.append("isOverlayRequired", "false");

    const res = await axios.post(endpoint, form, {
      headers: { apikey: apiKey },
    });

    if (res.data?.IsErroredOnProcessing) {
      const message = res.data?.ErrorMessage;
      throw new Error(
        Array.isArray(message)
          ? message.join("; ")
          : message || "OCR.space request failed"
      );
    }

    const results: OcrSpaceParsedResult[] = Array.isArray(
      res.data?.ParsedResults
    )
      ? res.data.ParsedResults
      : [];
    return normalizeOcrText(
      results
        .map((result) => String(result?.ParsedText || ""))
        .filter(Boolean)
        .join("\n")
    );
  } catch (error) {
    throwOcrRequestError(error);
  }
};
