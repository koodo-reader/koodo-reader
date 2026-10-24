import type { OCRPlugin } from "../../types";
import {
  parseImageBase64,
  splitTextToLines,
  throwOcrRequestError,
} from "./common";

interface PuterAI {
  ai?: {
    img2txt?: (
      image: string,
      options?: Record<string, unknown>
    ) => Promise<string>;
  };
}

declare global {
  interface Window {
    puter?: PuterAI;
  }
}

const loadPuter = async (): Promise<PuterAI> => {
  if (typeof window === "undefined") {
    throw new Error("Puter OCR is only available in browser environment");
  }

  if (window.puter?.ai?.img2txt) {
    return window.puter;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-puter-sdk="true"]'
    );
    if (existing) {
      if (window.puter?.ai?.img2txt) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Puter.js")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.puter.com/v2/";
    script.async = true;
    script.dataset.puterSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Puter.js"));
    document.head.appendChild(script);
  });

  if (!window.puter?.ai?.img2txt) {
    throw new Error("Puter OCR is unavailable");
  }
  return window.puter;
};

export const recognize: OCRPlugin = async (imageBase64, _axios, config) => {
  try {
    const puter = await loadPuter();
    const { dataUrl } = parseImageBase64(imageBase64);
    const provider = config.provider || "aws-textract";
    const text = await puter.ai!.img2txt!(dataUrl, { provider });
    return splitTextToLines(text);
  } catch (error) {
    throwOcrRequestError(error);
  }
};
