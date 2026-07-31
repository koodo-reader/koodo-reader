import type { TranslatePlugin } from "../../types";
import { getPluginRequestError } from "../requestError";

function percentEncode(value) {
  return encodeURIComponent(value)
    .replace(/\+/g, "%20")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

function toBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function hmacSha1Base64(key, message) {
  const rawKey = new TextEncoder().encode(key);
  const data = new TextEncoder().encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return toBase64(signature);
}

function getTimestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function getNonce() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function buildCanonicalQuery(params) {
  return Object.keys(params)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join("&");
}

export const translate: TranslatePlugin = async (text, from, to, axios, config) => {
  const accessKeyId = (config && config.accessKeyId) || "";
  const accessKeySecret = (config && config.accessKeySecret) || "";
  const endpoint = (config && config.endpoint) || "https://mt.cn-hangzhou.aliyuncs.com/";
  const regionId = (config && config.regionId) || "cn-hangzhou";
  const formatType = (config && config.formatType) || "text";
  const sourceLanguage = from && from !== "" ? from : "auto";
  const targetLanguage = to || "zh";

  if (!accessKeyId || !accessKeySecret) {
    return "Missing Alibaba Cloud accessKeyId or accessKeySecret";
  }

  const params: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: "TranslateGeneral",
    Format: "JSON",
    FormatType: formatType,
    RegionId: regionId,
    Scene: "general",
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: getNonce(),
    SignatureVersion: "1.0",
    SourceLanguage: sourceLanguage,
    SourceText: text,
    TargetLanguage: targetLanguage,
    Timestamp: getTimestamp(),
    Version: "2018-10-12",
  };

  if (config && config.context) {
    params.Context = config.context;
  }

  const canonicalizedQueryString = buildCanonicalQuery(params);
  const stringToSign = `POST&${percentEncode("/")}&${percentEncode(canonicalizedQueryString)}`;
  params.Signature = await hmacSha1Base64(`${accessKeySecret}&`, stringToSign);

  try {
    const body = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      body.append(key, params[key]);
    });

    const res = await axios.post(endpoint, body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (res.status === 200 && res.data) {
      if (res.data.Code && Number(res.data.Code) !== 200) {
        return `${res.data.Code}: ${res.data.Message || "Request failed"}`;
      }
      if (res.data.Data && res.data.Data.Translated) {
        return res.data.Data.Translated;
      }
      if (res.data.Message) {
        return res.data.Message;
      }
    }

    return "Error happened";
  } catch (error) {
    return getPluginRequestError(error);
  }
}
