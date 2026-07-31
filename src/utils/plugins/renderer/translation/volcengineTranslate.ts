import type { TranslatePlugin } from "../../types";
import { getPluginRequestError } from "../requestError";

function percentEncode(value) {
  return encodeURIComponent(String(value))
    .replace(/[!'()*]/g, (char) =>
      `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(message) {
  const data =
    typeof message === "string" ? new TextEncoder().encode(message) : message;
  return crypto.subtle.digest("SHA-256", data);
}

async function sha256Hex(message) {
  return toHex(await sha256(message));
}

async function hmacSha256(key, message, encoding?) {
  const rawKey = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const data =
    typeof message === "string" ? new TextEncoder().encode(message) : message;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return encoding === "hex" ? toHex(signature) : signature;
}

function getRequestDate() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildCanonicalQuery(params) {
  return Object.keys(params)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join("&");
}

function buildCanonicalHeaders(headers) {
  return Object.keys(headers)
    .sort()
    .map((key) => `${key}:${String(headers[key]).trim().replace(/\s+/g, " ")}`)
    .join("\n");
}

export const translate: TranslatePlugin = async (text, from, to, axios, config) => {
  const accessKeyId = (config && config.accessKeyId) || "";
  const secretAccessKey = (config && config.secretAccessKey) || "";
  const region = (config && config.region) || "cn-north-1";
  const sessionToken = (config && config.sessionToken) || "";
  const host = (config && config.host) || "translate.volcengineapi.com";
  const action = "TranslateText";
  const version = "2020-06-01";
  const service = "translate";

  if (!accessKeyId || !secretAccessKey) {
    return "Missing Volcengine accessKeyId or secretAccessKey";
  }

  const payloadObject: { TargetLanguage: string; TextList: string[]; SourceLanguage?: string } = {
    TargetLanguage: to || "zh",
    TextList: [text],
  };

  if (from && from !== "" && from !== "detect" && from !== "auto") {
    payloadObject.SourceLanguage = from;
  }

  const payload = JSON.stringify(payloadObject);
  const hashedPayload = await sha256Hex(payload);
  const requestDate = getRequestDate();
  const shortDate = requestDate.slice(0, 8);
  const query = buildCanonicalQuery({
    Action: action,
    Version: version,
  });

  const canonicalHeadersMap = {
    "content-type": "application/json",
    host: host,
    "x-content-sha256": hashedPayload,
    "x-date": requestDate,
  };

  if (sessionToken) {
    canonicalHeadersMap["x-security-token"] = sessionToken;
  }

  const signedHeaders = Object.keys(canonicalHeadersMap).sort().join(";");
  const canonicalHeaders = `${buildCanonicalHeaders(canonicalHeadersMap)}\n`;
  const canonicalRequest = [
    "POST",
    "/",
    query,
    canonicalHeaders,
    signedHeaders,
    hashedPayload,
  ].join("\n");

  const credentialScope = `${shortDate}/${region}/${service}/request`;
  const stringToSign = [
    "HMAC-SHA256",
    requestDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = await hmacSha256(secretAccessKey, shortDate);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "request");
  const signature = await hmacSha256(kSigning, stringToSign, "hex");
  const authorization =
    `HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers = {
    Authorization: authorization,
    "Content-Type": "application/json",
    "X-Content-Sha256": hashedPayload,
    "X-Date": requestDate,
  };

  if (sessionToken) {
    headers["X-Security-Token"] = sessionToken;
  }

  try {
    const res = await axios.post(`https://${host}/?${query}`, payload, {
      headers,
    });

    if (res.status === 200 && res.data) {
      const { ResponseMetadata, TranslationList } = res.data;
      if (ResponseMetadata && ResponseMetadata.Error) {
        return `${ResponseMetadata.Error.Code}: ${ResponseMetadata.Error.Message}`;
      }
      if (
        Array.isArray(TranslationList) &&
        TranslationList[0] &&
        typeof TranslationList[0].Translation === "string"
      ) {
        return TranslationList[0].Translation;
      }
    }

    return "Error happened";
  } catch (error) {
    return getPluginRequestError(error);
  }
}
