import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (
  text,
  from,
  to,
  axios,
  config
) => {
  let accessKeyId = config.accessKeyId || "";
  let secretAccessKey = config.secretAccessKey || "";
  let region = config.region || "us-east-1";

  let endpoint = `https://translate.${region}.amazonaws.com`;
  let path = "/";
  let service = "translate";
  let host = `translate.${region}.amazonaws.com`;

  let body = JSON.stringify({
    Text: text,
    SourceLanguageCode: from && from !== "" ? from : "auto",
    TargetLanguageCode: to,
  });

  // AWS Signature Version 4
  function hmac(key, data, encoding?) {
    // Use SubtleCrypto for HMAC-SHA256
    return crypto.subtle
      .importKey(
        "raw",
        typeof key === "string" ? new TextEncoder().encode(key) : key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      )
      .then((cryptoKey) =>
        crypto.subtle.sign(
          "HMAC",
          cryptoKey,
          typeof data === "string" ? new TextEncoder().encode(data) : data
        )
      )
      .then((sig) => {
        if (encoding === "hex") {
          return Array.from(new Uint8Array(sig))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        }
        return new Uint8Array(sig);
      });
  }

  async function sha256Hex(data) {
    let buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(data)
    );
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function getISODate(date) {
    return (
      date
        .toISOString()
        .replace(/[:\-]|\.\d{3}/g, "")
        .slice(0, 15) + "Z"
    );
  }

  function getDateStamp(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, "");
  }

  let now = new Date();
  let amzDate = getISODate(now);
  let dateStamp = getDateStamp(now);

  let headers = {
    "Content-Type": "application/x-amz-json-1.1",
    Host: host,
    "X-Amz-Date": amzDate,
    "X-Amz-Target": "AWSShineFrontendService_20170701.TranslateText",
  };

  // Canonical headers (sorted)
  let signedHeadersList = [
    "content-type",
    "host",
    "x-amz-date",
    "x-amz-target",
  ];
  let canonicalHeaders =
    `content-type:${headers["Content-Type"]}\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${headers["X-Amz-Target"]}\n`;
  let signedHeaders = signedHeadersList.join(";");

  let payloadHash = await sha256Hex(body);

  let canonicalRequest = [
    "POST",
    path,
    "", // no query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  let algorithm = "AWS4-HMAC-SHA256";
  let credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  let canonicalRequestHash = await sha256Hex(canonicalRequest);

  let stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join("\n");

  // Derive signing key
  let kDate = await hmac(`AWS4${secretAccessKey}`, dateStamp);
  let kRegion = await hmac(kDate, region);
  let kService = await hmac(kRegion, service);
  let kSigning = await hmac(kService, "aws4_request");
  let signature = await hmac(kSigning, stringToSign, "hex");

  let authorizationHeader =
    `${algorithm} Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  let requestHeaders = {
    "Content-Type": headers["Content-Type"],
    "X-Amz-Date": amzDate,
    "X-Amz-Target": headers["X-Amz-Target"],
    Authorization: authorizationHeader,
  };

  let transRes = await axios.post(endpoint + path, body, {
    headers: requestHeaders,
  });

  if (transRes.status === 200) {
    return transRes.data.TranslatedText;
  } else {
    return "Error happened";
  }
};
