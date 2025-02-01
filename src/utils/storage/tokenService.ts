import { isElectron } from "react-device-detect";
import { BrowserFingerprint } from "../common";

export default class TokenService {
  static async saveAllToken(token: string): Promise<void> {
    // Encrypt token using safeStorage
    console.log(token, "savealltoken");
    if (!token) return;
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.invoke("encrypt-data", { token });
    } else {
      const encrypted = await this.encryptString(token);
      localStorage.setItem("encryptedToken", encrypted);
    }
  }

  static async getAllToken(): Promise<string | null> {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      return await ipcRenderer.invoke("decrypt-data");
    } else {
      let encrypted = localStorage.getItem("encryptedToken") || "";
      console.log(encrypted, "encrypted");
      if (!encrypted) return null;
      return await this.decryptString(encrypted);
    }
  }

  static async setToken(key: string, value: string): Promise<void> {
    const tokens = JSON.parse((await this.getAllToken()) || "{}");
    tokens[key] = value;
    await this.saveAllToken(JSON.stringify(tokens));
  }

  static async getToken(key: string): Promise<string | null> {
    const tokens = JSON.parse((await this.getAllToken()) || "{}");
    console.log(tokens, key);
    return tokens[key] || null;
  }

  static async deleteToken(key: string): Promise<void> {
    const tokens = JSON.parse((await this.getAllToken()) || "{}");
    delete tokens[key];
    await this.saveAllToken(JSON.stringify(tokens));
  }
  static async encryptString(token: string): Promise<string> {
    let fingerprint = await BrowserFingerprint.generate();
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(fingerprint)
    );
    const key = await crypto.subtle.importKey(
      "raw",
      hashBuffer,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12)); // 生成随机初始化向量
    const encoder = new TextEncoder();
    const encodedToken = encoder.encode(token);
    const encryptedToken = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encodedToken
    );

    const buffer = new Uint8Array(encryptedToken);
    const ivAndData = new Uint8Array(iv.length + buffer.length);
    ivAndData.set(iv);
    ivAndData.set(buffer, iv.length);
    return String.fromCharCode(...ivAndData);
  }

  static async decryptString(encryptedString: string): Promise<string> {
    let fingerprint = await BrowserFingerprint.generate();
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(fingerprint)
    );
    const key = await crypto.subtle.importKey(
      "raw",
      hashBuffer,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const ivAndData = new Uint8Array(
      encryptedString.split("").map((char) => char.charCodeAt(0))
    );
    const iv = ivAndData.slice(0, 12);
    const data = ivAndData.slice(12);

    const decryptedToken = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedToken);
  }
}
