import type { AxiosInstance } from "axios";
import type { PluginConfig } from "../../types";
import {
  base64ToUint8Array,
  getNonce,
  getTimestamp,
  hmacSha1Base64,
  normalizeOcrText,
  parseImageBase64,
  percentEncode,
  throwOcrRequestError,
} from "./common";

const buildQuery = (params: Record<string, string>): string =>
  Object.keys(params)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join("&");

export const recognizeWithAliyun = async (
  action: string,
  extraParams: Record<string, string>,
  imageBase64: string,
  axios: AxiosInstance,
  config: PluginConfig
): Promise<string> => {
  const accessKeyId = config.accessKeyId || "";
  const accessKeySecret = config.accessKeySecret || "";

  if (!accessKeyId || !accessKeySecret) {
    throw new Error("Missing Alibaba Cloud accessKeyId or accessKeySecret");
  }

  try {
    const endpoint = (
      config.endpoint || "https://ocr-api.cn-hangzhou.aliyuncs.com/"
    ).replace(/\/?$/, "/");
    const { base64 } = parseImageBase64(imageBase64);

    const params: Record<string, string> = {
      Action: action,
      Version: "2021-07-07",
      Format: "JSON",
      AccessKeyId: accessKeyId,
      SignatureNonce: getNonce(),
      Timestamp: getTimestamp(),
      SignatureMethod: "HMAC-SHA1",
      SignatureVersion: "1.0",
      ...extraParams,
    };

    const canonicalizedQueryString = buildQuery(params);
    const stringToSign = `POST&${percentEncode("/")}&${percentEncode(
      canonicalizedQueryString
    )}`;
    params.Signature = await hmacSha1Base64(
      `${accessKeySecret}&`,
      stringToSign
    );

    const url = `${endpoint}?${buildQuery(params)}`;
    const body = base64ToUint8Array(base64);
    const res = await axios.post(url, body, {
      headers: { "Content-Type": "application/octet-stream" },
    });

    if (res.data?.Code) {
      throw new Error(
        `${res.data.Code}: ${res.data.Message || "Aliyun OCR request failed"}`
      );
    }

    const data =
      typeof res.data?.Data === "string"
        ? JSON.parse(res.data.Data)
        : res.data?.Data;
    return normalizeOcrText(data?.content || data?.Content);
  } catch (error) {
    throwOcrRequestError(error);
  }
};
