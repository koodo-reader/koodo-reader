import { getPluginRequestError } from "../requestError";

export interface ParsedImage {
  base64: string;
  mimeType: string;
  dataUrl: string;
}

export const parseImageBase64 = (
  imageBase64: string,
  defaultMimeType = "image/png"
): ParsedImage => {
  const value = (imageBase64 || "").trim();
  const commaIndex = value.indexOf(",");
  if (
    value.startsWith("data:") &&
    commaIndex > 5 &&
    value.slice(0, commaIndex).includes(";base64")
  ) {
    const header = value.slice(5, commaIndex);
    const mimeType = header.split(";")[0] || defaultMimeType;
    return {
      base64: value.slice(commaIndex + 1).trim(),
      mimeType,
      dataUrl: value,
    };
  }
  return {
    base64: value,
    mimeType: defaultMimeType,
    dataUrl: `data:${defaultMimeType};base64,${value}`,
  };
};

export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary = atob(base64.replace(/\s+/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const normalizeOcrText = (text: unknown): string => {
  if (typeof text !== "string") return "";
  return text.replace(/\r\n?/g, "\n").trim();
};

export const extractChatContent = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text || "");
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
};

export const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const sha256Hex = async (
  data: string | Uint8Array
): Promise<string> => {
  const source =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  return toHex(await crypto.subtle.digest("SHA-256", source as BufferSource));
};

export const hmacSha256 = async (
  key: string | Uint8Array,
  data: string | Uint8Array,
  encoding?: "hex"
): Promise<Uint8Array | string> => {
  const rawKey =
    typeof key === "string" ? new TextEncoder().encode(key) : key;
  const source =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    source as BufferSource
  );
  return encoding === "hex" ? toHex(signature) : new Uint8Array(signature);
};

export const hmacSha1Base64 = async (
  key: string,
  message: string
): Promise<string> => {
  const rawKey = new TextEncoder().encode(key);
  const data = new TextEncoder().encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  return arrayBufferToBase64(
    await crypto.subtle.sign("HMAC", cryptoKey, data)
  );
};

export const percentEncode = (value: string): string =>
  encodeURIComponent(value)
    .replace(/\+/g, "%20")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");

export const getTimestamp = (): string =>
  new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

export const getNonce = (): string => {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export function throwOcrRequestError(error: unknown): never {
  throw new Error(getPluginRequestError(error));
}
