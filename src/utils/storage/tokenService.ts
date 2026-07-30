import { isElectron } from "react-device-detect";
import { v4 as uuidv4 } from "uuid";
import {
  CommonTool,
  ConfigService,
} from "../../assets/lib/kookit-extra-browser.min";
export default class TokenService {
  static async saveAllToken(token: string): Promise<void> {
    if (!token) return;
    if (isElectron) {
      const ipcRenderer = window.electronAPI;
      await ipcRenderer.invoke("encrypt-data", { token });
    } else {
      const encrypted = await this.encryptString(token);
      localStorage.setItem("encryptedToken", encrypted);
    }
  }

  static async getAllToken(): Promise<string | null> {
    if (isElectron) {
      const ipcRenderer = window.electronAPI;
      return await ipcRenderer.invoke("decrypt-data");
    } else {
      let encrypted = localStorage.getItem("encryptedToken") || "";
      if (!encrypted) return null;
      let decrypted = await this.decryptString(encrypted);
      return decrypted;
    }
  }

  static async setToken(key: string, value: string): Promise<void> {
    const tokens = JSON.parse((await this.getAllToken()) || "{}");
    tokens[key] = value;
    await this.saveAllToken(JSON.stringify(tokens));
  }

  static async getToken(key: string): Promise<string | null> {
    const tokens = JSON.parse((await this.getAllToken()) || "{}");
    return tokens[key] || null;
  }

  static async deleteToken(key: string): Promise<void> {
    const tokens = JSON.parse((await this.getAllToken()) || "{}");
    delete tokens[key];
    await this.saveAllToken(JSON.stringify(tokens));
  }
  static async encryptString(payload: string): Promise<string> {
    try {
      let fingerprint = await this.getFingerprint();
      const secret = await generateSecret(fingerprint);
      const token =
        typeof crypto !== "undefined" && crypto.subtle
          ? await generateJWT(payload, secret)
          : CommonTool.simpleEncrypt(payload, secret);
      return token;
    } catch (error) {
      console.error("Error generating secret:", error);
      return "";
    }
  }

  static async decryptString(encryptedString: string): Promise<string> {
    try {
      let fingerprint = await this.getFingerprint();
      const secret = await generateSecret(fingerprint);
      const decoded =
        typeof crypto !== "undefined" && crypto.subtle
          ? await verifyJWT(encryptedString, secret)
          : CommonTool.simpleDecrypt(encryptedString, secret);
      return decoded;
    } catch (error) {
      console.error("Error generating secret:", error);
      return "";
    }
  }
  public static async getFingerprint(): Promise<string> {
    if (isElectron) {
      const ipcRenderer = window.electronAPI;
      let mac = await ipcRenderer.invoke("get-mac");
      return mac;
    } else {
      let deviceUuid = ConfigService.getItem("fingerPrint");
      if (deviceUuid) {
        return deviceUuid;
      }
      let fingerprint = uuidv4().replace(/-/g, "");
      ConfigService.setItem("fingerPrint", fingerprint);
      return fingerprint;
    }
  }
}
// 工具函数：Base64Url 编码
function base64urlEncode(str) {
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(str))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// 工具函数：Base64Url 解码
function base64urlDecode(base64url) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binStr = atob(base64);
  const binArray = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    binArray[i] = binStr.charCodeAt(i);
  }
  return binArray;
}

// 生成 JWT
async function generateJWT(
  payload,
  secret,
  header = { alg: "HS256", typ: "JWT" }
) {
  // 编码头部
  const encodedHeader = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(header))
  );

  // 编码载荷
  const encodedPayload = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );

  // 准备签名数据
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

  // 导入密钥
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );

  // 生成签名
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const encodedSignature = base64urlEncode(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

// 验证 JWT
async function verifyJWT(token, secret) {
  // 解析 JWT
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

  // 验证签名
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const signature = await base64urlDecode(encodedSignature);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["verify"]
  );

  const isValid = await crypto.subtle.verify("HMAC", key, signature, data);

  if (!isValid) throw new Error("Invalid signature");

  // 解析载荷
  const payload = JSON.parse(
    new TextDecoder().decode(base64urlDecode(encodedPayload))
  );

  return payload;
}
// 工具函数：将 ArrayBuffer 转换为 Base64 字符串
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 工具函数：将字符串转换为 256 位密钥
async function generateSecret(inputString) {
  // 将输入字符串编码为 ArrayBuffer
  const encoder = new TextEncoder();
  const msgBuffer = encoder.encode(inputString);

  // 使用 SHA-256 哈希函数生成 256 位密钥
  const hashBuffer =
    typeof crypto !== "undefined" && crypto.subtle
      ? await crypto.subtle.digest("SHA-256", msgBuffer)
      : CommonTool.jsDigestSHA256(msgBuffer);

  // 将 ArrayBuffer 转换为 Base64 字符串
  const secret = arrayBufferToBase64(hashBuffer);

  return secret;
}
