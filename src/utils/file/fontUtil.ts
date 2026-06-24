import { isElectron } from "react-device-detect";
import { getServerRegion, getStorageLocation, loadFontData } from "../common";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { LocalFileManager } from "./localFile";
import localforage from "localforage";
import { Buffer } from "buffer";
import i18n from "../../i18n";

declare var window: any;

const FONT_FOLDER = "font";

export interface FontItem {
  label: string;
  value: string;
  type: string;
}

export function translateFontStyle(
  style: string,
  t: (key: string) => string
): string {
  return style
    .split(" ")
    .map((part) => t(part))
    .join(" ");
}

export function translateFontName(
  name: string,
  t: (key: string) => string
): string {
  return t(name);
}

const FONT_MIME: Record<string, string> = {
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
};

class FontUtil {
  static normalizeFontName(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf(".");
    const base =
      lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
    return base.replaceAll(" ", "_").replaceAll("-", "_").replaceAll(".", "_");
  }

  static getFontExtension(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase() || "ttf";
    return ext;
  }

  static isValidFontExtension(ext: string): boolean {
    return ["ttf", "otf", "woff"].includes(ext.toLowerCase());
  }

  static isCustomFont(value: string): boolean {
    if (!value || value === "Built-in font") return false;
    if (value.startsWith('"')) return false;
    const meta = ConfigService.getObjectConfig(value, "customFonts", null);
    return !!meta;
  }

  static async saveFont(
    fontKey: string,
    arrayBuffer: ArrayBuffer,
    type: string
  ): Promise<void> {
    const filename = `${fontKey}.${type}`;

    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const dir = path.join(getStorageLocation() || "", FONT_FOLDER);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, filename), Buffer.from(arrayBuffer));
    } else if (ConfigService.getReaderConfig("isUseLocal") === "yes") {
      await LocalFileManager.saveFile(filename, arrayBuffer, FONT_FOLDER);
    } else {
      const mime = FONT_MIME[type] || "font/ttf";
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const dataUrl = `data:${mime};base64,${base64}`;
      await localforage.setItem(`font_${fontKey}`, dataUrl);
    }
  }

  static async loadFontArrayBuffer(
    fontKey: string,
    type?: string
  ): Promise<ArrayBuffer | null> {
    const meta = this.getFontMeta(fontKey);
    const ext = type || meta?.type || "ttf";
    const filename = `${fontKey}.${ext}`;

    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const dir = path.join(getStorageLocation() || "", FONT_FOLDER);
      if (!fs.existsSync(dir)) return null;
      const files: string[] = fs.readdirSync(dir);
      const file = files.find((f) => f.startsWith(fontKey + "."));
      if (!file) return null;
      const buf: Buffer = fs.readFileSync(path.join(dir, file));
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }

    if (ConfigService.getReaderConfig("isUseLocal") === "yes") {
      const buf = await LocalFileManager.readFile(filename, FONT_FOLDER);
      return buf || null;
    }

    const dataUrl = await localforage.getItem<string>(`font_${fontKey}`);
    if (!dataUrl) return null;
    const base64Data = dataUrl.replace(/^data:.*;base64,/, "");
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes.buffer;
  }

  static async getFontUrl(fontKey: string): Promise<string> {
    const meta = this.getFontMeta(fontKey);
    if (!meta) return "";
    const buffer = await this.loadFontArrayBuffer(fontKey, meta.type);
    if (!buffer) return "";
    const mime = FONT_MIME[meta.type] || "font/ttf";
    const blob = new Blob([buffer], { type: mime });
    return URL.createObjectURL(blob);
  }

  static async deleteFont(fontKey: string): Promise<void> {
    const meta = this.getFontMeta(fontKey);
    const ext = meta?.type;

    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const dir = path.join(getStorageLocation() || "", FONT_FOLDER);
      if (!fs.existsSync(dir)) return;
      const files: string[] = fs.readdirSync(dir);
      const file = files.find((f) => f.startsWith(fontKey + "."));
      if (file) {
        const filePath = path.join(dir, file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } else if (ConfigService.getReaderConfig("isUseLocal") === "yes") {
      const extensions = ext ? [ext] : ["ttf", "otf", "woff", "woff2"];
      for (const type of extensions) {
        await LocalFileManager.deleteFile(
          `${fontKey}.${type}`,
          FONT_FOLDER
        ).catch(() => {});
      }
    } else {
      await localforage.removeItem(`font_${fontKey}`);
    }
  }

  static saveFontMeta(fontKey: string, meta: FontItem): void {
    ConfigService.setObjectConfig(fontKey, meta, "customFonts");
  }

  static getFontMeta(fontKey: string): FontItem | null {
    return ConfigService.getObjectConfig(fontKey, "customFonts", null);
  }

  static deleteFontMeta(fontKey: string): void {
    ConfigService.setObjectConfig(fontKey, null, "customFonts");
  }

  static getFontIds(): string[] {
    return ConfigService.getAllListConfig("fontList") || [];
  }

  static addFontId(fontKey: string): void {
    ConfigService.setListConfig(fontKey, "fontList");
  }

  static removeFontId(fontKey: string): void {
    ConfigService.deleteListConfig(fontKey, "fontList");
  }

  static getInstalledFonts(): FontItem[] {
    const ids = this.getFontIds();
    const fonts: FontItem[] = [];
    for (const id of ids) {
      const meta = this.getFontMeta(id);
      if (meta) fonts.push(meta);
    }
    return fonts;
  }

  static clearFontReferences(fontKey: string): void {
    if (ConfigService.getReaderConfig("fontFamily") === fontKey) {
      ConfigService.setReaderConfig("fontFamily", "");
    }
    if (ConfigService.getReaderConfig("subFontFamily") === fontKey) {
      ConfigService.setReaderConfig("subFontFamily", "");
    }
    if (ConfigService.getReaderConfig("systemFont") === fontKey) {
      ConfigService.setReaderConfig("systemFont", "");
    }
  }

  static async getMergedFontOptions(): Promise<
    { label: string; value: string }[]
  > {
    const customOptions = this.getFontIds()
      .map((id) => this.getFontMeta(id))
      .filter((meta): meta is FontItem => !!meta)
      .map((meta) => ({ label: meta.label, value: meta.value }));

    const systemFonts = (await loadFontData()) || [];

    return [
      { label: "Built-in font", value: "Built-in font" },
      ...customOptions,
      ...systemFonts,
    ];
  }

  static notifyFontListChanged(): void {
    window.dispatchEvent(new Event("font-list-changed"));
  }

  static getFeaturedFontUrl(fontPath: string, isAuthed: boolean): string {
    const base =
      getServerRegion() === "china" && isAuthed
        ? "https://storage.koodoreader.cn"
        : "https://storage.koodoreader.com";
    return `${base}/fonts${fontPath}`;
  }

  static async downloadFeaturedFont(
    font: {
      id: string;
      fontName: string;
      style: string;
      url: string;
    },
    isAuthed: boolean,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    const url = this.getFeaturedFontUrl(font.url, isAuthed);
    const response = await fetch(url, {
      headers: {
        "Cache-Control": "no-transform",
        "Accept-Encoding": "identity",
      },
    });
    if (!response.ok) return false;

    const contentLength = Number(response.headers.get("Content-Length") || 0);
    const reader = response.body?.getReader();
    if (!reader) {
      const buffer = await response.arrayBuffer();
      await this.saveFont(font.id, buffer, "ttf");
      const label =
        i18n.t(font.fontName) +
        " " +
        font.style
          .split(" ")
          .map((subStyle) => i18n.t(subStyle))
          .join(" ");
      this.saveFontMeta(font.id, { label, value: font.id, type: "ttf" });
      this.addFontId(font.id);
      this.notifyFontListChanged();
      return true;
    }

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

    const buffer = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    await this.saveFont(font.id, buffer.buffer, "ttf");
    const label =
      i18n.t(font.fontName) +
      " " +
      font.style
        .split(" ")
        .map((subStyle) => i18n.t(subStyle))
        .join(" ");
    this.saveFontMeta(font.id, { label, value: font.id, type: "ttf" });
    this.addFontId(font.id);
    this.notifyFontListChanged();
    return true;
  }
}

export default FontUtil;
