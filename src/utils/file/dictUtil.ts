import { isElectron } from "react-device-detect";
import { getStorageLocation } from "../common";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import i18n from "../../i18n";

export interface CloudDictItem {
  id: string;
  name: string;
  translation: string;
  source: string;
}

export type DictKind =
  | "mdict"
  | "stardict"
  | "dict"
  | "slob"
  | "bgl"
  | "unknown";

export interface DictFiles {
  [key: string]: string | string[];
}

export interface DictMeta {
  id: string;
  name: string;
  kind: DictKind;
  files: DictFiles;
  addedAt: number;
  unsupported?: boolean;
  unsupportedReason?: string;
}

export interface DictImportError {
  name: string;
  message: string;
}

export interface DictImportResult {
  ok: boolean;
  imported: DictMeta[];
  orphans: string[];
  errors: DictImportError[];
  message?: string;
}

interface MigrateResult {
  migrated?: DictMeta[];
  removedIds?: string[];
}

declare var window: any;

const DICT_LAYOUT_VERSION = "2";

class DictUtil {
  private static getStoragePath(): string {
    return getStorageLocation() || "";
  }

  private static async invoke<T>(channel: string, args: any): Promise<T> {
    return await window.electronAPI.invoke(channel, {
      storagePath: this.getStoragePath(),
      ...args,
    });
  }

  /**
   * One-time upgrade from the old loose `<storage>/dict/<id>.<ext>` layout to
   * the directory layout `<storage>/dict/<id>/<file>`.  Failures are ignored
   * per item so a single broken dictionary never blocks the rest.
   */
  static async ensureMigrated(): Promise<void> {
    if (!isElectron) return;
    const layoutVersion = ConfigService.getItem("dictLayoutVersion");
    if (layoutVersion === DICT_LAYOUT_VERSION) {
      return;
    }

    const ids: string[] = this.getDictIds();
    const dicts = ids.map((id) => ({
      id,
      name: this.getDictMeta(id)?.name || "",
    }));

    try {
      const result = await this.invoke<MigrateResult>("dict-migrate", { dicts });
      for (const dict of result?.migrated || []) {
        if (!dict || !dict.id) continue;
        ConfigService.setObjectConfig(dict.id, dict, "customDicts");
      }
      for (const id of result?.removedIds || []) {
        this.deleteDictMeta(id);
        this.removeDictId(id);
      }
      ConfigService.setItem("dictLayoutVersion", DICT_LAYOUT_VERSION);
    } catch (error) {
      console.error("Dictionary migration failed:", error);
    }
  }

  /** Open the multi-file picker and return the selected dictionary files. */
  static async pickFiles(): Promise<string[]> {
    if (!isElectron) return [];
    const result = await window.electronAPI.invoke("select-file", {
      multiple: true,
      filters: [
        {
          name: "Dictionaries",
          extensions: [
            "mdx",
            "mdd",
            "css",
            "ifo",
            "idx",
            "dict",
            "dz",
            "syn",
            "index",
            "slob",
            "bgl",
          ],
        },
        { name: "All files", extensions: ["*"] },
      ],
    });
    if (Array.isArray(result)) return result;
    return result ? [result] : [];
  }

  /** Import files (already copied and grouped by the main process). */
  static async importDictionaries(
    filePaths: string[]
  ): Promise<DictImportResult> {
    if (!isElectron) {
      return {
        ok: false,
        imported: [],
        orphans: [],
        errors: [],
        message: "not-supported",
      };
    }
    const result = await this.invoke<DictImportResult>("dict-import", {
      filePaths,
    });
    if (!result || !Array.isArray(result.imported)) {
      return {
        ok: false,
        imported: [],
        orphans: [],
        errors: [],
        message: "invalid-response",
      };
    }
    for (const dict of result.imported) {
      this.persistDict(dict);
    }
    return result;
  }

  /** Remove a dictionary and all of its files. */
  static async removeDict(id: string): Promise<boolean> {
    if (!isElectron) return false;
    const result = await this.invoke<{ ok: boolean }>("dict-remove", {
      dictId: id,
    });
    if (result?.ok) {
      this.deleteDictMeta(id);
      this.removeDictId(id);
    }
    return !!result?.ok;
  }

  /** Look up a word in a local dictionary. */
  static async lookupWord(id: string, word: string): Promise<string> {
    if (!isElectron) return "";
    try {
      const result = await this.invoke<{
        ok: boolean;
        content?: string;
        reason?: string;
        message?: string;
      }>("dict-lookup", { dictId: id, word });
      if (!result || !result.ok) {
        if (result?.reason === "not-found") {
          toast.error(i18n.t("Word not found in dictionary"));
        } else if (result?.reason === "unsupported") {
          toast.error(i18n.t("This dictionary format is not supported"));
        } else if (result?.reason === "error") {
          console.error("Dict lookup error:", result.message);
          toast.error(i18n.t("Dictionary lookup failed"));
        }
        return "";
      }
      return String(result.content || "");
    } catch (error) {
      console.error("Dict lookup error:", error);
      return "";
    }
  }

  private static persistDict(dict: DictMeta): void {
    if (!dict || !dict.id) return;
    ConfigService.setObjectConfig(dict.id, dict, "customDicts");
    this.addDictId(dict.id);
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
  static getCloudDictUrl(dictId: string, _isAuthed: boolean): string {
    const base = "https://storage.koodoreader.com";
    return `${base}/dicts/${dictId}.mdx`;
  }

  /** Download a cloud dict with progress, then import it locally. */
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
      return await this.saveDownloadedDict(dict, buffer);
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

    return await this.saveDownloadedDict(dict, buffer.buffer);
  }

  private static async saveDownloadedDict(
    dict: CloudDictItem,
    arrayBuffer: ArrayBuffer
  ): Promise<boolean> {
    if (!isElectron) return false;
    try {
      const result = await this.invoke<{ ok: boolean; dict?: DictMeta }>(
        "dict-import-buffer",
        {
          id: dict.id,
          name: this.getCloudDictDisplayName(dict),
          extension: "mdx",
          buffer: arrayBuffer,
        }
      );
      if (!result?.ok || !result.dict) return false;
      this.persistDict(result.dict);
      return true;
    } catch (error) {
      console.error("Failed to save downloaded dictionary:", error);
      return false;
    }
  }
}

export default DictUtil;
