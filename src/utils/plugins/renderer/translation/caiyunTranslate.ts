import type { TranslatePlugin } from "../../types";
import { getPluginRequestError } from "../requestError";

function getRequestId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export const translate: TranslatePlugin = async (text, from, to, axios, config) => {
  const token = (config && config.token) || "";
  const endpoint =
    (config && config.endpoint) ||
    "https://api.interpreter.caiyunai.com/v1/translator";
  const sourceLanguage = from || "auto";
  const targetLanguage = to || "zh";

  if (!token) {
    return "Missing Caiyun token";
  }

  if (sourceLanguage === targetLanguage) {
    return text;
  }

  const payload = {
    source: text,
    trans_type: `${sourceLanguage}2${targetLanguage}`,
    request_id: getRequestId(),
    detect: sourceLanguage === "auto",
    media: "text",
  };

  try {
    const response = await axios.post(endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Authorization": `token ${token}`,
      },
    });

    if (response.status === 200 && response.data) {
      if (typeof response.data.target === "string") {
        return response.data.target;
      }

      if (
        Array.isArray(response.data.target) &&
        typeof response.data.target[0] === "string"
      ) {
        return response.data.target[0];
      }

      if (response.data.message) {
        return response.data.message;
      }
    }

    return "Error happened";
  } catch (error) {
    return getPluginRequestError(error);
  }
}
