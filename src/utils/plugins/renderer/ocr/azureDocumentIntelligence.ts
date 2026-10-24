import type { OCRPlugin } from "../../types";
import {
  base64ToUint8Array,
  parseImageBase64,
  splitTextToLines,
  throwOcrRequestError,
} from "./common";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const recognize: OCRPlugin = async (imageBase64, axios, config) => {
  const endpoint = (config.endpoint || "").replace(/\/+$/, "");
  const apiKey = config.apiKey || "";
  const modelId = config.modelId || "prebuilt-read";
  const apiVersion = config.apiVersion || "2024-11-30";

  if (!endpoint || !apiKey) {
    throw new Error("Missing Azure Document Intelligence endpoint or apiKey");
  }

  try {
    const { base64 } = parseImageBase64(imageBase64);
    const bytes = base64ToUint8Array(base64);
    const url =
      `${endpoint}/documentintelligence/documentModels/` +
      `${encodeURIComponent(modelId)}:analyze` +
      `?api-version=${encodeURIComponent(String(apiVersion))}`;

    const res = await axios.post(url, bytes, {
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/octet-stream",
      },
    });

    if (res.data?.analyzeResult?.content) {
      return splitTextToLines(res.data.analyzeResult.content);
    }

    const operationLocation =
      res.headers?.["operation-location"] || res.headers?.["Operation-Location"];
    if (!operationLocation) {
      throw new Error("Missing Azure operation location");
    }

    for (let attempt = 0; attempt < 60; attempt += 1) {
      await sleep(1000);
      const poll = await axios.get(operationLocation, {
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
        },
      });
      const status = poll.data?.status;
      if (status === "succeeded") {
        return splitTextToLines(poll.data?.analyzeResult?.content);
      }
      if (status === "failed") {
        throw new Error(
          poll.data?.error?.message ||
            "Azure Document Intelligence analysis failed"
        );
      }
    }

    throw new Error("Azure Document Intelligence analysis timed out");
  } catch (error) {
    throwOcrRequestError(error);
  }
};
