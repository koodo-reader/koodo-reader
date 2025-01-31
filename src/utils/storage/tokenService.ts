import { BrowserFingerprint } from "../common";

export default class TokenService {
  static async saveAllToken(token: string): Promise<void> {
    try {
      // Encrypt token using safeStorage
      const encrypted = await this.encryptString(token);
      localStorage.setItem("encryptedToken", encrypted);
    } catch (error) {
      console.error("Failed to save token:", error);
      throw error;
    }
  }

  static async getAllToken(): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem("encryptedToken") || "";
      return await this.decryptString(encrypted);
    } catch (error) {
      console.error("Failed to read token:", error);
      return null;
    }
  }

  static async deleteAllToken(): Promise<void> {
    try {
      localStorage.removeItem("encryptedToken");
    } catch (error) {
      console.error("Failed to delete token:", error);
    }
  }
  static async setToken(key: string, value: string): Promise<void> {
    try {
      const tokens = JSON.parse((await this.getAllToken()) || "{}");
      tokens[key] = value;
      await this.saveAllToken(JSON.stringify(tokens));
    } catch (error) {
      console.error("Failed to set token:", error);
      throw error;
    }
  }

  static async getToken(key: string): Promise<string | null> {
    try {
      const tokens = JSON.parse((await this.getAllToken()) || "{}");
      console.log(tokens, key);
      return tokens[key] || null;
    } catch (error) {
      console.error("Failed to get token:", error);
      return null;
    }
  }

  static async deleteToken(key: string): Promise<void> {
    try {
      const tokens = JSON.parse((await this.getAllToken()) || "{}");
      delete tokens[key];
      await this.saveAllToken(JSON.stringify(tokens));
    } catch (error) {
      console.error("Failed to delete token:", error);
      throw error;
    }
  }
  // static async encryptString(token: string) {
  //   let fingerprint = await BrowserFingerprint.generate();
  //   return btoa(token + fingerprint);
  // }
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

  // static async decryptString(encrypted: string | null) {
  //   if (!encrypted) return null;
  //   let decoded = atob(encrypted);
  //   console.log(decoded, "decoded");
  //   let fingerprint = await BrowserFingerprint.generate();
  //   if (decoded.endsWith(fingerprint)) {
  //     return decoded.slice(0, -fingerprint.length);
  //   } else {
  //     return null;
  //   }
  // }
}
