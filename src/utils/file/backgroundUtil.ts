import { isElectron } from "react-device-detect";
import { getStorageLocation } from "../common";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { LocalFileManager } from "./localFile";
import localforage from "localforage";
import { Buffer } from "buffer";
// @ts-ignore – no bundled type declarations
import ColorThief from "color-thief-browser";

declare var window: any;

const BG_FOLDER = "background";

class BackgroundUtil {
  /** Convert a data-URL to { extension, arrayBuffer } */
  static convertDataUrl(dataUrl: string): {
    extension: string;
    arrayBuffer: ArrayBuffer;
  } {
    const mimeMatch = dataUrl.match(/^data:(image\/(\w+));base64,/);
    let extension = mimeMatch ? mimeMatch[2] : "png";
    if (extension === "jpeg") extension = "jpg";
    const base64Data = dataUrl.replace(/^data:.*;base64,/, "");
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return { extension, arrayBuffer: bytes.buffer };
  }

  /** Save image file for an id. */
  static async saveImage(id: string, dataUrl: string): Promise<void> {
    const { extension, arrayBuffer } = this.convertDataUrl(dataUrl);
    const filename = `${id}.${extension}`;

    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const dir = path.join(getStorageLocation() || "", BG_FOLDER);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, filename), Buffer.from(arrayBuffer));
    } else {
      if (ConfigService.getReaderConfig("isUseLocal") === "yes") {
        await LocalFileManager.saveFile(filename, arrayBuffer, BG_FOLDER);
      } else {
        // store raw dataUrl in localforage keyed by `background_<id>`
        await localforage.setItem(`background_${id}`, dataUrl);
      }
    }
  }

  /** Load image data URL by id. Returns empty string if not found. */
  static async loadImage(id: string, extension?: string): Promise<string> {
    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const dir = path.join(getStorageLocation() || "", BG_FOLDER);
      if (!fs.existsSync(dir)) return "";
      const files: string[] = fs.readdirSync(dir);
      const file = files.find((f) => f.startsWith(id + "."));
      if (!file) return "";
      const filePath = path.join(dir, file);
      const ext = file.split(".").pop() || "png";
      const buf: Buffer = fs.readFileSync(filePath);
      const base64 = buf.toString("base64");
      const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
      return `data:${mime};base64,${base64}`;
    } else {
      if (ConfigService.getReaderConfig("isUseLocal") === "yes") {
        const ext = extension || "png";
        const filename = `${id}.${ext}`;
        const buf = await LocalFileManager.readFile(filename, BG_FOLDER);
        if (!buf) return "";
        const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
        const base64 = Buffer.from(buf).toString("base64");
        return `data:${mime};base64,${base64}`;
      } else {
        const dataUrl = await localforage.getItem<string>(`background_${id}`);
        return dataUrl || "";
      }
    }
  }

  /** Delete image file by id. */
  static async deleteImage(id: string): Promise<void> {
    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const dir = path.join(getStorageLocation() || "", BG_FOLDER);
      if (!fs.existsSync(dir)) return;
      const files: string[] = fs.readdirSync(dir);
      const file = files.find((f) => f.startsWith(id + "."));
      if (file) {
        const filePath = path.join(dir, file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } else {
      if (ConfigService.getReaderConfig("isUseLocal") === "yes") {
        // Try common extensions
        for (const ext of ["png", "jpg", "jpeg", "webp", "gif"]) {
          await LocalFileManager.deleteFile(`${id}.${ext}`, BG_FOLDER).catch(
            () => {}
          );
        }
      } else {
        await localforage.removeItem(`background_${id}`);
      }
    }
  }

  /**
   * Background image metadata is stored via ConfigService.setObjectConfig
   * using the image id as key and "customBackgrounds" as the store name.
   * Each entry: { id, name, extension, textColor?, backgroundColor? }
   */
  static saveImageMeta(
    id: string,
    meta: {
      name: string;
      extension: string;
      textColor?: string;
      backgroundColor?: string;
    }
  ): void {
    ConfigService.setObjectConfig(id, { id, ...meta }, "customBackgrounds");
  }

  static getImageMeta(id: string): {
    id: string;
    name: string;
    extension: string;
    textColor?: string;
    backgroundColor?: string;
  } | null {
    return ConfigService.getObjectConfig(id, "customBackgrounds", null);
  }

  /**
   * Analyse dominant color from a data-URL and return recommended
   * backgroundColor and textColor values.
   */
  static async analyzeImageColors(
    dataUrl: string
  ): Promise<{ backgroundColor: string; textColor: string }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const colorThief = new ColorThief();
          const [r, g, b]: [number, number, number] = colorThief.getColor(
            img,
            10
          );
          const backgroundColor = `#${r.toString(16).padStart(2, "0")}${g
            .toString(16)
            .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
          // WCAG-based luminance contrast
          const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          const textColor = luminance > 0.5 ? "#000000" : "#ffffff";
          resolve({ backgroundColor, textColor });
        } catch {
          resolve({ backgroundColor: "#ffffff", textColor: "#000000" });
        }
      };
      img.onerror = () => {
        resolve({ backgroundColor: "#ffffff", textColor: "#000000" });
      };
      img.src = dataUrl;
    });
  }

  static deleteImageMeta(id: string): void {
    ConfigService.setObjectConfig(id, null, "customBackgrounds");
  }

  /** Return all stored image ids using ConfigService list config */
  static getImageIds(): string[] {
    return ConfigService.getAllListConfig("backgroundList") || [];
  }

  static addImageId(id: string): void {
    ConfigService.setListConfig(id, "backgroundList");
  }

  static removeImageId(id: string): void {
    ConfigService.deleteListConfig(id, "backgroundList");
  }
}

export default BackgroundUtil;
