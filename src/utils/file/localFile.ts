import {
  CommonTool,
  ConfigService,
} from "../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../storage/databaseService";
import Book from "../../models/Book";
import CoverUtil from "./coverUtil";
import BookUtil from "./bookUtil";
import toast from "react-hot-toast";
import i18n from "../../i18n";

declare global {
  interface FileSystemDirectoryHandle {
    getFileHandle(
      name: string,
      options?: { create?: boolean }
    ): Promise<FileSystemFileHandle>;
    getDirectoryHandle(
      name: string,
      options?: { create?: boolean }
    ): Promise<FileSystemDirectoryHandle>;
    removeEntry(name: string): Promise<void>;
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    queryPermission(options?: { mode?: string }): Promise<string>;
    requestPermission(options?: { mode?: string }): Promise<string>;
    readonly name: string;
  }

  interface FileSystemHandle {
    readonly kind: "file" | "directory";
    readonly name: string;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: "file";
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemWritableFileStream {
    write(content: string | ArrayBuffer): Promise<void>;
    close(): Promise<void>;
  }

  interface Window {
    showDirectoryPicker(options?: {
      mode?: string;
      startIn?: string;
    }): Promise<FileSystemDirectoryHandle>;
  }
}
export class LocalFileManager {
  private static directoryHandle: FileSystemDirectoryHandle | null = null;
  private static readonly STORAGE_KEY = "koodo_directory_handle";

  // 检查浏览器是否支持 File System Access API
  static isSupported(): boolean {
    return "showDirectoryPicker" in window;
  }

  // 请求目录访问权限
  static async requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
    try {
      if (!this.isSupported()) {
        throw new Error("File System Access API not supported");
      }

      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
        startIn: "documents",
      });

      // 存储权限句柄到 IndexedDB
      await this.storeDirectoryHandle(directoryHandle);
      this.directoryHandle = directoryHandle;

      return directoryHandle;
    } catch (error) {
      console.error("Error requesting directory access:", error);
      return null;
    }
  }
  // 添加用户友好的权限状态检查方法
  static async getPermissionStatus(): Promise<{
    hasAccess: boolean;
    needsReauthorization: boolean;
    directoryName?: string;
  }> {
    try {
      const storedHandle = await this.retrieveDirectoryHandle();

      if (!storedHandle) {
        return { hasAccess: false, needsReauthorization: false };
      }

      const permission = await (storedHandle as any).queryPermission({
        mode: "readwrite",
      });

      return {
        hasAccess: permission === "granted",
        needsReauthorization: permission === "prompt",
        directoryName: storedHandle.name,
      };
    } catch (error) {
      return { hasAccess: false, needsReauthorization: false };
    }
  }
  // 修改 ensureDirectoryAccess 方法，移除自动权限请求
  static async ensureDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
    try {
      // 首先尝试获取已存储的句柄
      const storedHandle = await this.retrieveDirectoryHandle();

      if (storedHandle) {
        const permission = await (storedHandle as any).queryPermission({
          mode: "readwrite",
        });

        if (permission === "granted") {
          this.directoryHandle = storedHandle;
          return storedHandle;
        } else if (permission === "prompt") {
          // 只有在用户直接交互中才能请求权限
          const newPermission = await (storedHandle as any).requestPermission({
            mode: "readwrite",
          });
          if (newPermission === "granted") {
            this.directoryHandle = storedHandle;
            return storedHandle;
          }
        }
      }

      // 如果没有有效的句柄，请求新的目录访问权限
      return await this.requestDirectoryAccess();
    } catch (error) {
      console.error("Error ensuring directory access:", error);
      return null;
    }
  }

  // 修改 getStoredDirectoryHandle，移除自动权限请求
  static async getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    try {
      if (this.directoryHandle) {
        // 验证权限是否仍然有效
        const permission = await (this.directoryHandle as any).queryPermission({
          mode: "readwrite",
        });
        if (permission === "granted") {
          return this.directoryHandle;
        }
      }

      // 从 IndexedDB 获取存储的句柄
      const storedHandle = await this.retrieveDirectoryHandle();
      if (storedHandle) {
        // 验证权限
        const permission = await (storedHandle as any).queryPermission({
          mode: "readwrite",
        });
        if (permission === "granted") {
          this.directoryHandle = storedHandle;
          return storedHandle;
        }

        // 如果权限被拒绝，清除存储的句柄
        if (permission === "denied") {
          await this.clearStoredAccess();
          throw new Error(
            "Directory access was denied. Please select a directory again."
          );
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting stored directory handle:", error);
      if (
        (error instanceof Error && error.message?.includes("denied")) ||
        (error instanceof Error && error.name === "NotAllowedError")
      ) {
        await this.clearStoredAccess();
      }
      return null;
    }
  }

  // 存储目录句柄到 IndexedDB
  private static async storeDirectoryHandle(
    handle: FileSystemDirectoryHandle
  ): Promise<void> {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(["handles"], "readwrite");
      const store = transaction.objectStore("handles");
      await store.put(handle, this.STORAGE_KEY);
    } catch (error) {
      console.error("Error storing directory handle:", error);
    }
  }

  // 从 IndexedDB 获取目录句柄
  private static async retrieveDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(["handles"], "readonly");
      const store = transaction.objectStore("handles");
      return new Promise((resolve, reject) => {
        const request = store.get(this.STORAGE_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Error retrieving directory handle:", error);
      return null;
    }
  }

  // 打开 IndexedDB 数据库
  private static openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("KoodoFileSystemDB", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("handles")) {
          db.createObjectStore("handles");
        }
      };
    });
  }

  // 创建嵌套文件夹（如果不存在）
  private static async ensureDirectoryExists(
    baseHandle: FileSystemDirectoryHandle,
    folderPath: string
  ): Promise<FileSystemDirectoryHandle> {
    if (!folderPath || folderPath === "." || folderPath === "") {
      return baseHandle;
    }

    // 规范化路径，移除开头和结尾的斜杠
    const normalizedPath = folderPath.replace(/^\/+|\/+$/g, "");
    const pathParts = normalizedPath
      .split("/")
      .filter((part) => part.length > 0);

    let currentHandle = baseHandle;

    for (const part of pathParts) {
      try {
        // 尝试获取现有文件夹
        currentHandle = await currentHandle.getDirectoryHandle(part);
      } catch (error) {
        // 如果文件夹不存在，创建新文件夹
        try {
          currentHandle = await currentHandle.getDirectoryHandle(part, {
            create: true,
          });
        } catch (createError) {
          console.error(`Error creating directory ${part}:`, createError);
          throw new Error(`Failed to create directory: ${part}`);
        }
      }
    }

    return currentHandle;
  }

  // 保存文件到本地目录（支持指定文件夹）
  static async saveFile(
    filename: string,
    content: string | ArrayBuffer,
    folderPath?: string
  ): Promise<boolean> {
    try {
      const directoryHandle = await this.getStoredDirectoryHandle();
      if (!directoryHandle) {
        throw new Error("No directory access permission");
      }

      // 如果指定了文件夹路径，确保文件夹存在
      let targetDirectory = directoryHandle;
      if (folderPath) {
        targetDirectory = await this.ensureDirectoryExists(
          directoryHandle,
          folderPath
        );
      }

      const fileHandle = await targetDirectory.getFileHandle(filename, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (error) {
      console.error("Error saving file:", error);
      return false;
    }
  }

  // 读取文件（支持指定文件夹）
  static async readFileAsString(
    filename: string,
    folderPath?: string
  ): Promise<string | null> {
    try {
      const directoryHandle = await this.getStoredDirectoryHandle();
      if (!directoryHandle) {
        throw new Error("No directory access permission");
      }

      // 如果指定了文件夹路径，导航到目标文件夹
      let targetDirectory = directoryHandle;
      if (folderPath) {
        const normalizedPath = folderPath.replace(/^\/+|\/+$/g, "");
        const pathParts = normalizedPath
          .split("/")
          .filter((part) => part.length > 0);

        for (const part of pathParts) {
          targetDirectory = await targetDirectory.getDirectoryHandle(part);
        }
      }

      const fileHandle = await targetDirectory.getFileHandle(filename);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (error) {
      console.error("Error reading file:", error);
      return null;
    }
  }

  // 读取文件为 ArrayBuffer（支持指定文件夹）
  static async readFile(
    filename: string,
    folderPath?: string
  ): Promise<ArrayBuffer | null> {
    console.log(`Reading file: ${filename} from folder: ${folderPath}`);
    try {
      const directoryHandle = await this.getStoredDirectoryHandle();
      if (!directoryHandle) {
        throw new Error("No directory access permission");
      }

      // 如果指定了文件夹路径，导航到目标文件夹
      let targetDirectory = directoryHandle;
      if (folderPath) {
        const normalizedPath = folderPath.replace(/^\/+|\/+$/g, "");
        const pathParts = normalizedPath
          .split("/")
          .filter((part) => part.length > 0);

        for (const part of pathParts) {
          targetDirectory = await targetDirectory.getDirectoryHandle(part);
        }
      }
      let isExist = await this.fileExists(filename, folderPath);
      if (!isExist) {
        console.info(`File ${filename} does not exist in ${folderPath}`);
        return null;
      }

      const fileHandle = await targetDirectory.getFileHandle(filename);
      const file = await fileHandle.getFile();
      return await file.arrayBuffer();
    } catch (error) {
      console.error("Error reading file as ArrayBuffer:", error);
      return null;
    }
  }

  // 检查文件是否存在（支持指定文件夹）
  static async fileExists(
    filename: string,
    folderPath?: string
  ): Promise<boolean> {
    try {
      const directoryHandle = await this.getStoredDirectoryHandle();
      if (!directoryHandle) {
        return false;
      }

      // 如果指定了文件夹路径，导航到目标文件夹
      let targetDirectory = directoryHandle;
      if (folderPath) {
        const normalizedPath = folderPath.replace(/^\/+|\/+$/g, "");
        const pathParts = normalizedPath
          .split("/")
          .filter((part) => part.length > 0);

        for (const part of pathParts) {
          try {
            targetDirectory = await targetDirectory.getDirectoryHandle(part);
          } catch (error) {
            return false; // 文件夹不存在
          }
        }
      }

      await targetDirectory.getFileHandle(filename);
      return true;
    } catch (error) {
      return false;
    }
  }

  // 删除文件（支持指定文件夹）
  static async deleteFile(
    filename: string,
    folderPath?: string
  ): Promise<boolean> {
    try {
      const directoryHandle = await this.getStoredDirectoryHandle();
      if (!directoryHandle) {
        throw new Error("No directory access permission");
      }

      // 如果指定了文件夹路径，导航到目标文件夹
      let targetDirectory = directoryHandle;
      if (folderPath) {
        const normalizedPath = folderPath.replace(/^\/+|\/+$/g, "");
        const pathParts = normalizedPath
          .split("/")
          .filter((part) => part.length > 0);

        for (const part of pathParts) {
          targetDirectory = await targetDirectory.getDirectoryHandle(part);
        }
      }
      let isExist = await this.fileExists(filename, folderPath);
      if (!isExist) {
        console.info(`File ${filename} does not exist in ${folderPath}`);
        return false;
      }

      await targetDirectory.removeEntry(filename);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  // 列出文件夹中的文件（支持指定文件夹）
  static async listFiles(folderPath?: string): Promise<string[]> {
    console.log("Listing files in folder:", folderPath);
    try {
      const directoryHandle = await this.getStoredDirectoryHandle();
      if (!directoryHandle) {
        throw new Error("No directory access permission");
      }

      // 如果指定了文件夹路径，导航到目标文件夹
      let targetDirectory = directoryHandle;
      if (folderPath) {
        const normalizedPath = folderPath.replace(/^\/+|\/+$/g, "");
        const pathParts = normalizedPath
          .split("/")
          .filter((part) => part.length > 0);

        for (const part of pathParts) {
          targetDirectory = await targetDirectory.getDirectoryHandle(part);
        }
      }

      const files: string[] = [];
      for await (const [name, handle] of targetDirectory.entries()) {
        if (handle.kind === "file") {
          files.push(name);
        }
      }

      return files;
    } catch (error) {
      console.error("Error listing files:", error);
      return [];
    }
  }

  // 检查是否有有效的目录访问权限
  static async hasValidAccess(): Promise<boolean> {
    const handle = await this.getStoredDirectoryHandle();
    return handle !== null;
  }

  // 清除存储的权限
  static async clearStoredAccess(): Promise<void> {
    try {
      this.directoryHandle = null;
      const db = await this.openDatabase();
      const transaction = db.transaction(["handles"], "readwrite");
      const store = transaction.objectStore("handles");
      await store.delete(this.STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing stored access:", error);
    }
  }
}
export const exportToLocalFile = async (): Promise<void> => {
  let databaseList = CommonTool.databaseList;

  for (let i = 0; i < databaseList.length; i++) {
    const dbName = databaseList[i];
    const fileName = `${dbName}.db`;
    if (dbName === "books") {
      let books: Book[] = await DatabaseService.getAllRecords("books");
      for (let i = 0; i < books.length; i++) {
        let book = books[i];
        if (book.cover) {
          try {
            let coverFileName = `${book.key}.${CoverUtil.base64ToFileType(
              book.cover
            )}`;
            await LocalFileManager.saveFile(
              coverFileName,
              CommonTool.base64ToArrayBuffer(book.cover.split("base64,")[1]),
              "cover"
            );
          } catch (error) {
            console.error(
              `Failed to export cover for book ${book.name}:`,
              error
            );
          }
        }
        let bookBuffer: ArrayBuffer | boolean | File | null =
          await BookUtil.fetchBook(
            book.key,
            book.format.toLowerCase(),
            true,
            book.path
          );
        if (bookBuffer && bookBuffer instanceof ArrayBuffer) {
          try {
            await LocalFileManager.saveFile(
              `${book.key}.${book.format.toLowerCase()}`,
              bookBuffer,
              "book"
            );
          } catch (error) {
            console.error(`Failed to export book ${book.name}:`, error);
          }
        }
      }
    }
    let records = await DatabaseService.getAllRecords(dbName);
    if (!records || records.length === 0) {
      console.warn(`No records found in database ${dbName}`);
      continue;
    }
    let dbBuffer = await DatabaseService.getDbBuffer(dbName);
    if (!dbBuffer) {
      console.error(`Database buffer for ${dbName} is null`);
      continue;
    }
    let directoryHandle = await LocalFileManager.getStoredDirectoryHandle();
    if (!directoryHandle) {
      console.error("No directory access permission");
      continue;
    }
    try {
      await LocalFileManager.saveFile(fileName, dbBuffer, "config");
    } catch (error) {
      console.error(`Failed to export ${fileName}:`, error);
    }
  }
};
