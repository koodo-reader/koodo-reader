import { isElectron } from "react-device-detect";
import { getServerRegion, getStorageLocation } from "../common";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { Buffer } from "buffer";
import toast from "react-hot-toast";
import i18n from "../../i18n";
import { CloudDictItem } from "../../constants/dictConfig";

declare var window: any;

const DICT_FOLDER = "dict";

export interface DictMeta {
  id: string;
  name: string;
  extension: string;
}

class DictUtil {
  /** Copy dict file directly from a local path (Electron only, avoids loading into memory) */
  static saveDictFromPath(id: string, sourcePath: string): void {
    const fs = window.electronAPI.fs;
    const path = window.electronAPI.path;
    const ext = sourcePath.split(".").pop()?.toLowerCase() || "mdx";
    const dir = path.join(getStorageLocation() || "", DICT_FOLDER);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(sourcePath, path.join(dir, `${id}.${ext}`));
  }

  /** Save dict file (ArrayBuffer) by id */
  static async saveDict(
    id: string,
    name: string,
    arrayBuffer: ArrayBuffer
  ): Promise<void> {
    const ext = name.split(".").pop()?.toLowerCase() || "mdx";
    const filename = `${id}.${ext}`;

    if (isElectron) {
      const fs = window.electronAPI.fs;
      const path = window.electronAPI.path;
      const dir = path.join(getStorageLocation() || "", DICT_FOLDER);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, filename), Buffer.from(arrayBuffer));
    }
  }

  /** Delete dict file by id */
  static async deleteDict(id: string): Promise<void> {
    if (isElectron) {
      const fs = window.electronAPI.fs;
      const path = window.electronAPI.path;
      const dir = path.join(getStorageLocation() || "", DICT_FOLDER);
      if (!fs.existsSync(dir)) return;
      const files: string[] = fs.readdirSync(dir);
      const file = files.find((f) => f.startsWith(id + "."));
      if (file) {
        const filePath = path.join(dir, file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }
  }

  /** Get file path for Electron only */
  static getDictFilePath(id: string): string | null {
    if (!isElectron) return null;
    const fs = window.electronAPI.fs;
    const path = window.electronAPI.path;
    const dir = path.join(getStorageLocation() || "", DICT_FOLDER);
    if (!fs.existsSync(dir)) return null;
    const files: string[] = fs.readdirSync(dir);
    const file = files.find((f) => f.startsWith(id + "."));
    return file ? path.join(dir, file) : null;
  }

  /** Look up a word in the local MDX dictionary */
  static async lookupWord(id: string, word: string): Promise<string> {
    if (isElectron) {
      try {
        const filePath = this.getDictFilePath(id);
        if (!filePath) return "";
        const result = await window.electronAPI.invoke("dict-lookup", {
          filePath,
          word,
        });
        if (!result) {
          toast.error(i18n.t("Word not found in dictionary"));
          return "";
        }
        return String(result);
      } catch (e) {
        console.error("Dict lookup error:", e);
        return "";
      }
    } else {
      // Browser: js-mdict requires file system access; not supported in web mode
      return "";
    }
  }

  /** Save dict metadata */
  static saveDictMeta(id: string, meta: Omit<DictMeta, "id">): void {
    ConfigService.setObjectConfig(id, { id, ...meta }, "customDicts");
  }

  /** Get dict metadata */
  static getDictMeta(id: string): DictMeta | null {
    return ConfigService.getObjectConfig(id, "customDicts", null);
  }

  /** Delete dict metadata */
  static deleteDictMeta(id: string): void {
    ConfigService.deleteObjectConfig(id, "customDicts");
  }

  /** Return all stored dict ids */
  static getDictIds(): string[] {
    return ConfigService.getAllListConfig("dictList") || [];
  }

  static addDictId(id: string): void {
    ConfigService.setListConfig(id, "dictList");
  }

  static removeDictId(id: string): void {
    ConfigService.deleteListConfig(id, "dictList");
  }

  /** Pick display name of a cloud dict according to current language */
  static getCloudDictDisplayName(dict: CloudDictItem): string {
    const lang = i18n.language || "";
    return lang.startsWith("zh") ? dict.translation : dict.name;
  }

  /** Build download url of a cloud dict */
  static getCloudDictUrl(dictId: string, isAuthed: boolean): string {
    const base =
      getServerRegion() === "china" && isAuthed
        ? "https://storage.koodoreader.cn"
        : "https://storage.koodoreader.com";
    return `${base}/dicts/${dictId}.mdx`;
  }

  /** Download a cloud dict with progress, then save it as a local dict */
  static async downloadCloudDict(
    dict: CloudDictItem,
    isAuthed: boolean,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    const url = this.getCloudDictUrl(dict.id, isAuthed);
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
      await this.saveDownloadedDict(dict, buffer);
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

    await this.saveDownloadedDict(dict, buffer.buffer);
    return true;
  }

  private static async saveDownloadedDict(
    dict: CloudDictItem,
    arrayBuffer: ArrayBuffer
  ): Promise<void> {
    const name = this.getCloudDictDisplayName(dict);
    await this.saveDict(dict.id, `${dict.id}.mdx`, arrayBuffer);
    this.saveDictMeta(dict.id, { name, extension: "mdx" });
    this.addDictId(dict.id);
  }
}

export default DictUtil;
