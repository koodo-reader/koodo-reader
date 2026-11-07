import type { OCRPlugin } from "../../types";
import {
  hmacSha256,
  parseImageBase64,
  sha256Hex,
  throwOcrRequestError,
} from "./common";

export const recognize: OCRPlugin = async (imageBase64, axios, config) => {
  const accessKeyId = config.accessKeyId || "";
  const secretAccessKey = config.secretAccessKey || "";
  const region = config.region || "us-east-1";
  const sessionToken = config.sessionToken || "";

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Missing AWS accessKeyId or secretAccessKey");
  }

  try {
    const { base64 } = parseImageBase64(imageBase64);
    const host = `textract.${region}.amazonaws.com`;
    const path = "/";
    const service = "textract";
    const body = JSON.stringify({ Document: { Bytes: base64 } });

    const now = new Date();
    const amzDate =
      now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");

    const headerEntries: [string, string][] = [
      ["content-type", "application/x-amz-json-1.1"],
      ["host", host],
      ["x-amz-date", amzDate],
      ["x-amz-target", "Textract.DetectDocumentText"],
    ];
    if (sessionToken) {
      headerEntries.push(["x-amz-security-token", sessionToken]);
    }
    headerEntries.sort(([left], [right]) => left.localeCompare(right));

    const canonicalHeaders = headerEntries
      .map(([key, value]) => `${key}:${value.trim()}\n`)
      .join("");
    const signedHeaders = headerEntries.map(([key]) => key).join(";");
    const payloadHash = await sha256Hex(body);

    const canonicalRequest = [
      "POST",
      path,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      await sha256Hex(canonicalRequest),
    ].join("\n");

    const kDate = await hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
    const kRegion = await hmacSha256(kDate, region);
    const kService = await hmacSha256(kRegion, service);
    const kSigning = await hmacSha256(kService, "aws4_request");
    const signature = await hmacSha256(kSigning, stringToSign, "hex");

    const authorization =
      `${algorithm} Credential=${accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Date": amzDate,
      "X-Amz-Target": "Textract.DetectDocumentText",
      Authorization: authorization,
    };
    if (sessionToken) {
      headers["X-Amz-Security-Token"] = sessionToken;
    }

    const res = await axios.post(`https://${host}${path}`, body, { headers });

    if (res.data?.__type) {
      throw new Error(res.data.message || res.data.__type);
    }

    const blocks = Array.isArray(res.data?.Blocks) ? res.data.Blocks : [];
    return blocks
      .filter((block) => block?.BlockType === "LINE")
      .map((block) => String(block?.Text || ""))
      .filter(Boolean)
      .join("\n");
  } catch (error) {
    throwOcrRequestError(error);
  }
};
