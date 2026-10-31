import type { OCRPlugin } from "../../types";
import {
  normalizeOcrText,
  parseImageBase64,
  throwOcrRequestError,
} from "./common";

export const recognize: OCRPlugin = async (imageBase64, axios, config) => {
  const apiKey = config.apiKey || "";
  if (!apiKey) {
    throw new Error("Missing Google Cloud Vision apiKey");
  }

  try {
    const { base64 } = parseImageBase64(imageBase64);
    const endpoint = (
      config.endpoint || "https://vision.googleapis.com/v1/images:annotate"
    ).replace(/\/+$/, "");
    const featureType = config.featureType || "TEXT_DETECTION";

    const res = await axios.post(
      `${endpoint}?key=${encodeURIComponent(apiKey)}`,
      {
        requests: [
          {
            image: { content: base64 },
            features: [{ type: featureType }],
          },
        ],
      }
    );

    const response = res.data?.responses?.[0];
    if (response?.error) {
      throw new Error(
        response.error.message || "Google Vision request failed"
      );
    }

    return normalizeOcrText(
      response?.fullTextAnnotation?.text ||
        response?.textAnnotations?.[0]?.description
    );
  } catch (error) {
    throwOcrRequestError(error);
  }
};
