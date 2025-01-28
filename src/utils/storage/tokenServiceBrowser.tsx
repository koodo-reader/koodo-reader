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
      const encrypted = localStorage.getItem("encryptedToken");
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
  static async encryptString(token: string) {
    let fingerprint = await BrowserFingerprint.generate();
    return btoa(token + fingerprint);
  }
  static async decryptString(encrypted: string | null) {
    if (!encrypted) return null;
    let decoded = atob(encrypted);
    let fingerprint = await BrowserFingerprint.generate();
    if (decoded.endsWith(fingerprint)) {
      return decoded.slice(0, -fingerprint.length);
    } else {
      return null;
    }
  }
}
