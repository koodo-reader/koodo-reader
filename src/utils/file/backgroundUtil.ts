import { isElectron } from "react-device-detect";
import { getStorageLocation } from "../common";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { LocalFileManager } from "./localFile";
import localforage from "localforage";
import { Buffer } from "buffer";
import i18n from "../../i18n";
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

  /** Save image file for an id from a data-URL. */
  static async saveImage(id: string, dataUrl: string): Promise<void> {
    const { extension, arrayBuffer } = this.convertDataUrl(dataUrl);
    await this.saveImageBuffer(id, arrayBuffer, extension);
  }

  /** Save raw image bytes for an id. */
  static async saveImageBuffer(
    id: string,
    arrayBuffer: ArrayBuffer,
    extension: string
  ): Promise<void> {
    const filename = `${id}.${extension}`;

    if (isElectron) {
      const fs = window.electronAPI.fs;
      const path = window.electronAPI.path;
      const dir = path.join(getStorageLocation() || "", BG_FOLDER);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, filename), Buffer.from(arrayBuffer));
    } else {
      if (ConfigService.getItem("isUseLocal") === "yes") {
        await LocalFileManager.saveFile(filename, arrayBuffer, BG_FOLDER);
      } else {
        const mime = extension === "jpg" ? "image/jpeg" : `image/${extension}`;
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        await localforage.setItem(
          `background_${id}`,
          `data:${mime};base64,${base64}`
        );
      }
    }
  }

  /** Load image data URL by id. Returns empty string if not found. */
  static async loadImage(id: string, extension?: string): Promise<string> {
    if (isElectron) {
      const fs = window.electronAPI.fs;
      const path = window.electronAPI.path;
      const dir = path.join(getStorageLocation() || "", BG_FOLDER);
      if (!fs.existsSync(dir)) return "";
      const files: string[] = fs.readdirSync(dir);
      const file = files.find((f) => f.startsWith(id + "."));
      if (!file) return "";
      const filePath = path.join(dir, file);
      const ext = file.split(".").pop() || "png";
      const buf: Buffer = fs.readFileSync(filePath);
      const base64 = Buffer.from(buf).toString("base64");
      const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
      return `data:${mime};base64,${base64}`;
    } else {
      if (ConfigService.getItem("isUseLocal") === "yes") {
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
      const fs = window.electronAPI.fs;
      const path = window.electronAPI.path;
      const dir = path.join(getStorageLocation() || "", BG_FOLDER);
      if (!fs.existsSync(dir)) return;
      const files: string[] = fs.readdirSync(dir);
      const file = files.find((f) => f.startsWith(id + "."));
      if (file) {
        const filePath = path.join(dir, file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } else {
      if (ConfigService.getItem("isUseLocal") === "yes") {
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
    ConfigService.deleteObjectConfig(id, "customBackgrounds");
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

  /** Featured backgrounds live on the public storage server, 1-indexed. */
  static getFeaturedBackgroundId(index: number): string {
    return `official-background-${index}`;
  }

  static getFeaturedThumbnailUrl(index: number): string {
    return `https://storage.koodoreader.com/backgrounds/desktop-thumbnail/official-background-${index}.png`;
  }

  static getFeaturedOriginalUrl(index: number): string {
    return `https://storage.koodoreader.com/backgrounds/desktop/official-background-${index}.png`;
  }

  /**
   * Download a featured background into local storage (with progress).
   * Returns its local data-URL, or null when the download fails.
   */
  static async downloadFeaturedBackground(
    index: number,
    onProgress?: (progress: number) => void
  ): Promise<string | null> {
    const id = this.getFeaturedBackgroundId(index);
    const extension = "png";
    const response = await fetch(this.getFeaturedOriginalUrl(index), {
      headers: {
        "Cache-Control": "no-transform",
        "Accept-Encoding": "identity",
      },
    });
    if (!response.ok) return null;

    const contentLength = Number(response.headers.get("Content-Length") || 0);
    let arrayBuffer: ArrayBuffer;
    const reader = response.body?.getReader();
    if (!reader) {
      arrayBuffer = await response.arrayBuffer();
    } else {
      const chunks: Uint8Array[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          if (contentLength > 0 && onProgress) {
            onProgress(received / contentLength);
          }
        }
      }
      const merged = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      arrayBuffer = merged.buffer;
    }

    await this.saveImageBuffer(id, arrayBuffer, extension);
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:image/${extension};base64,${base64}`;
    const { backgroundColor, textColor } = await this.analyzeImageColors(
      dataUrl
    );
    this.saveImageMeta(id, {
      name: `${i18n.t("Official background")} ${index}`,
      extension,
      backgroundColor,
      textColor,
    });
    this.addImageId(id);
    return dataUrl;
  }
}

export default BackgroundUtil;
