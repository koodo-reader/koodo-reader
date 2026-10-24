import type { AxiosInstance } from "axios";
import type { PluginConfig } from "../../types";
import {
  hmacSha256,
  parseImageBase64,
  sha256Hex,
  throwOcrRequestError,
} from "./common";

const getDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const recognizeWithTencent = async (
  action: string,
  imageBase64: string,
  axios: AxiosInstance,
  config: PluginConfig
): Promise<string[]> => {
  const secretId = config.secretId || "";
  const secretKey = config.secretKey || "";
  const region = config.region || "ap-beijing";

  if (!secretId || !secretKey) {
    throw new Error("Missing Tencent Cloud secretId or secretKey");
  }

  try {
    const { base64 } = parseImageBase64(imageBase64);
    const host = "ocr.tencentcloudapi.com";
    const service = "ocr";
    const version = "2018-11-19";
    const timestamp = Math.floor(Date.now() / 1000);
    const date = getDate(timestamp);
    const payload = JSON.stringify({ ImageBase64: base64 });

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

    if (res.data?.Response?.Error) {
      throw new Error(
        `${res.data.Response.Error.Code}: ${
          res.data.Response.Error.Message || "Tencent OCR request failed"
        }`
      );
    }

    const detections = Array.isArray(res.data?.Response?.TextDetections)
      ? res.data.Response.TextDetections
      : [];
    return detections
      .map((item: { DetectedText?: string }) =>
        String(item?.DetectedText || "")
      )
      .filter(Boolean);
  } catch (error) {
    throwOcrRequestError(error);
  }
};
