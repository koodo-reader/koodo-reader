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

function extractEventPayloads(rawText) {
  const normalized = rawText.replace(/\r\n/g, "\n");

  if (!normalized.includes("data:")) {
    return normalized
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return normalized
    .split("\n\n")
    .map((block) =>
      block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join(""),
    )
    .filter(Boolean);
}

function parseStreamResult(rawText, streamType) {
  const payloads = extractEventPayloads(rawText);
  let latestFull = "";
  let incremental = "";
  let lastError = "";

  payloads.forEach((payload) => {
    let parsed;

    try {
      parsed = JSON.parse(payload);
    } catch (error) {
      return;
    }

    if (parsed.successful === false || parsed.code !== "0") {
      lastError = `${parsed.code || "Error"}: ${parsed.message || "Request failed"}`;
      return;
    }

    if (!parsed.data) {
      return;
    }

    if (typeof parsed.data.transFull === "string") {
      latestFull = parsed.data.transFull;
    }

    if (typeof parsed.data.transIncre === "string") {
      incremental += parsed.data.transIncre;
    }
  });

  if (latestFull) {
    return latestFull;
  }

  if (incremental) {
    return incremental;
  }

  if (lastError) {
    return lastError;
  }

  return streamType === "increment" ? incremental : latestFull;
}

export const translate: TranslatePlugin = async (text, from, to, axios, config) => {
  const appKey = (config && config.appKey) || "";
  const appSecret = (config && config.appSecret) || "";
  const endpoint =
    (config && config.endpoint) || "https://openapi.youdao.com/proxy/http/llm-trans";
  const sourceLanguage = from || "auto";
  const targetLanguage = to || "zh-CHS";
  const salt = getSalt();
  const curtime = String(Math.floor(Date.now() / 1000));
  const streamType = (config && config.streamType) || "full";
  const handleOption =
    config && config.handleOption !== undefined && config.handleOption !== null
      ? String(config.handleOption)
      : "0";

  if (!appKey || !appSecret) {
    return "Missing Youdao appKey or appSecret";
  }

  const params: Record<string, string> = {
    appKey: appKey,
    salt: salt,
    signType: "v3",
    curtime: curtime,
    sign: await sha256Hex(appKey + truncate(text) + salt + curtime + appSecret),
    i: text,
    from: sourceLanguage,
    to: targetLanguage,
    streamType: streamType,
    handleOption: handleOption,
  };

  if (config && config.prompt) {
    params.prompt = config.prompt;
  }

  if (config && config.vocabId) {
    params.vocabId = config.vocabId;
  }

  if (config && config.enableInterTrans !== undefined && config.enableInterTrans !== "") {
    params.enableInterTrans = String(config.enableInterTrans);
  }

  try {
    const body = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      body.append(key, params[key]);
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: body.toString(),
    });

    const rawText = await response.text();
    const result = parseStreamResult(rawText, streamType);

    if (result) {
      return result;
    }

    if (!response.ok) {
      return `${response.status}: ${response.statusText || "Request failed"}`;
    }

    return "Error happened";
  } catch (error) {
    return getPluginRequestError(error);
  }
}
