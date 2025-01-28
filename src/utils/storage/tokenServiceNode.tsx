import { getStorageLocation } from "../common";
const fs = window.require("fs");
const path = window.require("path");
const { safeStorage } = window.require("electron");
const dataPath = getStorageLocation() || "";
let tokenPath = path.join(dataPath, "token.enc");
export default class TokenService {
  static async saveAllToken(token: string): Promise<void> {
    try {
      // Encrypt token using safeStorage
      const encrypted = safeStorage.encryptString(token);
      await fs.writeFile(tokenPath, encrypted);
    } catch (error) {
      console.error("Failed to save token:", error);
      throw error;
    }
  }

  static async getAllToken(): Promise<string | null> {
    try {
      const encrypted = await fs.readFile(tokenPath);
      return safeStorage.decryptString(encrypted);
    } catch (error) {
      console.error("Failed to read token:", error);
      return null;
    }
  }

  static async deleteAllToken(): Promise<void> {
    try {
      await fs.unlink(tokenPath);
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
}
