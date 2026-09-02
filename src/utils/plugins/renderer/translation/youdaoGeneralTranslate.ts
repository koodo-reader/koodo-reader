import type { TranslatePlugin } from "../../types";
import { getPluginRequestError } from "../requestError";

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(message) {
  const data =
    typeof message === "string" ? new TextEncoder().encode(message) : message;
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

function truncate(text) {
  if (text.length <= 20) {
    return text;
  }

  return text.slice(0, 10) + String(text.length) + text.slice(-10);
}

function getSalt() {
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
  const appKey = (config && config.appKey) || "";
  const appSecret = (config && config.appSecret) || "";
  const endpoint = (config && config.endpoint) || "https://openapi.youdao.com/api";
  const sourceLanguage = from || "auto";
  const targetLanguage = to || "zh-CHS";
  const salt = getSalt();
  const curtime = String(Math.floor(Date.now() / 1000));

  if (!appKey || !appSecret) {
    return "Missing Youdao appKey or appSecret";
  }

  const params: Record<string, string> = {
    q: text,
    from: sourceLanguage,
    to: targetLanguage,
    appKey: appKey,
    salt: salt,
    signType: "v3",
    curtime: curtime,
    sign: await sha256Hex(appKey + truncate(text) + salt + curtime + appSecret),
  };

  if (config && config.ext) {
    params.ext = config.ext;
  }

  if (config && config.voice !== undefined && config.voice !== "") {
    params.voice = String(config.voice);
  }

  if (config && config.strict !== undefined && config.strict !== "") {
    params.strict = String(config.strict);
  }

  if (config && config.vocabId) {
    params.vocabId = config.vocabId;
  }

  if (config && config.domain) {
    params.domain = config.domain;
  }

  if (config && config.rejectFallback !== undefined && config.rejectFallback !== "") {
    params.rejectFallback = String(config.rejectFallback);
  }

  try {
    const body = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      body.append(key, params[key]);
    });

    const response = await axios.post(endpoint, body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    });

    if (response.status === 200 && response.data) {
      if (response.data.errorCode && response.data.errorCode !== "0") {
        return `${response.data.errorCode}: ${response.data.errorMsg || "Request failed"}`;
      }

      if (
        Array.isArray(response.data.translation) &&
        typeof response.data.translation[0] === "string"
      ) {
        return response.data.translation[0];
      }
    }

    return "Error happened";
  } catch (error) {
    return getPluginRequestError(error);
  }
}
