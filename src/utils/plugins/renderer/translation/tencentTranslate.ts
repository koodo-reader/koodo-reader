import type { TranslatePlugin } from "../../types";

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
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

function getDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const translate: TranslatePlugin = async (text, from, to, axios, config) => {
  const secretId = (config && config.secretId) || "";
  const secretKey = (config && config.secretKey) || "";
  const region = (config && config.region) || "ap-beijing";
  const host = "tmt.tencentcloudapi.com";
  const service = "tmt";
  const action = "TextTranslate";
  const version = "2018-03-21";
  const timestamp = Math.floor(Date.now() / 1000);
  const date = getDate(timestamp);

  if (!secretId || !secretKey) {
    return "Missing Tencent Cloud secretId or secretKey";
  }

  const payload = JSON.stringify({
    SourceText: text,
    Source: from && from !== "" ? from : "auto",
    Target: to || "zh",
    ProjectId: 0,
  });

  const signedHeaders = "content-type;host";
  const canonicalHeaders =
    `content-type:application/json; charset=utf-8\n` + `host:${host}\n`;
  const canonicalRequest = [
    "POST",
    "/",
    "",
    canonicalHeaders,
    signedHeaders,
    await sha256Hex(payload),
  ].join("\n");

  const credentialScope = `${date}/${service}/tc3_request`;
  const stringToSign = [
    "TC3-HMAC-SHA256",
    String(timestamp),
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = await hmacSha256(`TC3${secretKey}`, date);
  const kService = await hmacSha256(kDate, service);
  const kSigning = await hmacSha256(kService, "tc3_request");
  const signature = await hmacSha256(kSigning, stringToSign, "hex");

  const authorization =
    `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers = {
    Authorization: authorization,
    "Content-Type": "application/json; charset=utf-8",
    "X-TC-Action": action,
    "X-TC-Timestamp": String(timestamp),
    "X-TC-Version": version,
    "X-TC-Region": region,
  };

  const res = await axios.post(`https://${host}/`, payload, { headers });

  if (res.status === 200 && res.data && res.data.Response) {
    if (res.data.Response.Error) {
      return `${res.data.Response.Error.Code}: ${res.data.Response.Error.Message}`;
    }
    return res.data.Response.TargetText;
  }

  return "Error happened";
}
