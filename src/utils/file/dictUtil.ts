import { isElectron } from "react-device-detect";
import { getStorageLocation } from "../common";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { LocalFileManager } from "./localFile";
import localforage from "localforage";
import { Buffer } from "buffer";
import toast from "react-hot-toast";
import i18n from "../../i18n";

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
    const fs = window.require("fs");
    const path = window.require("path");
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
      const fs = window.require("fs");
      const path = window.require("path");
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
      const fs = window.require("fs");
      const path = window.require("path");
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
    const fs = window.require("fs");
    const path = window.require("path");
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
        const { MDX } = window.require("js-mdict");
        const mdict = new MDX(filePath);
        const result = mdict.lookup(word);
        if (
          !result ||
          result.definition === null ||
          result.definition === undefined
        ) {
          toast.error(i18n.t("Word not found in dictionary"));
          return "";
        }
        return String(result.definition);
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
    ConfigService.setObjectConfig(id, null, "customDicts");
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
}

export default DictUtil;
