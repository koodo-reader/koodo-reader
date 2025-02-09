import {
  ConfigService,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import localforage from "localforage";
import BookModel from "../../models/Book";
import toast from "react-hot-toast";
import { getStorageLocation } from "../common";
import { Buffer } from "buffer";
import SyncService from "../storage/syncService";
import { CommonTool } from "../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../storage/databaseService";
import Book from "../../models/Book";
import i18n from "../../i18n";
import { getCloudConfig } from "./common";
declare var window: any;

class BookUtil {
  static addBook(key: string, format: string, buffer: ArrayBuffer) {
    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const dataPath = getStorageLocation() || "";
      try {
        if (!fs.existsSync(path.join(dataPath, "book"))) {
          fs.mkdirSync(path.join(dataPath, "book"), { recursive: true });
        }
        fs.writeFileSync(
          path.join(dataPath, "book", key + "." + format),
          Buffer.from(buffer)
        );
      } catch (error) {
        throw error;
      }
    } else {
      return localforage.setItem(key, buffer);
    }
    this.uploadBook(key, format);
  }
  static deleteBook(key: string, format: string) {
    if (isElectron) {
      const fs_extra = window.require("fs-extra");
      const path = window.require("path");
      const dataPath = getStorageLocation() || "";
      return new Promise<void>((resolve, reject) => {
        try {
          fs_extra.remove(
            path.join(dataPath, `book`, key + "." + format),
            (err) => {
              if (err) throw err;
              this.deleteCloudBook(key, format);
              resolve();
            }
          );
        } catch (e) {
          reject();
        }
      });
    } else {
      this.deleteCloudBook(key, format);
      return localforage.removeItem(key);
    }
  }
  static isBookExist(key: string, format: string, bookPath: string) {
    return new Promise<boolean>((resolve) => {
      if (isElectron) {
        var fs = window.require("fs");
        var path = window.require("path");
        let _bookPath = path.join(
          getStorageLocation() || "",
          `book`,
          key + "." + format
        );

        if (key.startsWith("cache")) {
          resolve(fs.existsSync(_bookPath));
        } else if (
          (bookPath && fs.existsSync(bookPath)) ||
          fs.existsSync(_bookPath)
        ) {
          resolve(true);
        } else {
          resolve(false);
        }
      } else {
        localforage.getItem(key).then((result) => {
          if (result) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      }
    });
  }
  static fetchBook(
    key: string,
    format: string,
    isArrayBuffer: boolean = false,
    bookPath: string
  ) {
    if (isElectron) {
      return new Promise<File | ArrayBuffer | boolean>((resolve) => {
        var fs = window.require("fs");
        var path = window.require("path");
        let _bookPath = path.join(
          getStorageLocation() || "",
          `book`,
          key + "." + format
        );
        var data;
        if (fs.existsSync(_bookPath)) {
          data = fs.readFileSync(_bookPath);
        } else if (bookPath && fs.existsSync(bookPath)) {
          data = fs.readFileSync(bookPath);
        } else {
          resolve(false);
        }

        let blobTemp = new Blob([data]);
        let fileTemp = new File([blobTemp], "data", {
          lastModified: new Date().getTime(),
          type: blobTemp.type,
        });
        if (isArrayBuffer) {
          resolve(new Uint8Array(data).buffer);
        } else {
          resolve(fileTemp);
        }
      });
    } else {
      return localforage.getItem(key) as Promise<ArrayBuffer>;
    }
  }
  static fetchAllBooks(Books: BookModel[]) {
    return Books.map((item) => {
      return this.fetchBook(
        item.key,
        item.format.toLowerCase(),
        true,
        item.path
      );
    });
  }
  static async redirectBook(book: BookModel) {
    if (
      !(await this.isBookExist(book.key, book.format.toLowerCase(), book.path))
    ) {
      if (
        ConfigService.getItem("defaultSyncOption") &&
        (await TokenService.getToken("is_authed")) === "yes" &&
        (await this.isBookExistInCloud(book.key))
      ) {
        toast.loading(i18n.t("Make it offline"), {
          id: "offline-book",
        });
        await this.downloadBook(book.key, book.format);
        toast.success(i18n.t("Offline successful"), {
          id: "offline-book",
        });
      } else {
        toast.error(i18n.t("Book not exists"));
        return;
      }
    }
    let ref = book.format.toLowerCase();

    if (isElectron) {
      if (ConfigService.getReaderConfig("isOpenInMain") === "yes") {
        window.require("electron").ipcRenderer.invoke("new-tab", {
          url: `${window.location.href.split("#")[0]}#/${ref}/${
            book.key
          }?title=${book.name}&file=${book.key}`,
        });
      } else {
        const { ipcRenderer } = window.require("electron");
        ipcRenderer.invoke("open-book", {
          url: `${window.location.href.split("#")[0]}#/${ref}/${
            book.key
          }?title=${book.name}&file=${book.key}`,
          isMergeWord: ConfigService.getReaderConfig("isMergeWord"),
          isAutoFullscreen: ConfigService.getReaderConfig("isAutoFullscreen"),
          isPreventSleep: ConfigService.getReaderConfig("isPreventSleep"),
        });
      }
    } else {
      window.open(
        `${window.location.href.split("#")[0]}#/${ref}/${book.key}?title=${
          book.name
        }&file=${book.key}`
      );
    }
  }
  static getBookUrl(book: BookModel) {
    let ref = book.format.toLowerCase();
    return `/${ref}/${book.key}`;
  }
  static reloadBooks() {
    if (isElectron) {
      if (ConfigService.getReaderConfig("isOpenInMain") === "yes") {
        window.require("electron").ipcRenderer.invoke("reload-tab", "ping");
      } else {
        window.require("electron").ipcRenderer.invoke("reload-reader", "ping");
      }
    } else {
      window.location.reload();
    }
  }
  static async isBookExistInCloud(key: string) {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let service = ConfigService.getItem("defaultSyncOption");
      if (!service) {
        return false;
      }
      let tokenConfig = await getCloudConfig(service);

      return await ipcRenderer.invoke("cloud-exist", {
        ...tokenConfig,
        fileName: key,
        service: service,
        type: "book",
        storagePath: getStorageLocation(),
      });
    } else {
      let syncUtil = await SyncService.getSyncUtil();
      return await syncUtil.isExist(key, "book");
    }
  }
  static async downloadCacheBook(key: string) {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let service = ConfigService.getItem("defaultSyncOption");
      if (!service) {
        return;
      }
      let tokenConfig = await getCloudConfig(service);

      await ipcRenderer.invoke("cloud-download", {
        ...tokenConfig,
        fileName: "cache-" + key + ".zip",
        service: service,
        type: "book",
        storagePath: getStorageLocation(),
      });
    } else {
      let syncUtil = await SyncService.getSyncUtil();
      let cache = await syncUtil.downloadFile("cache-" + key + ".zip", "book");
      await this.addBook("cache-" + key, "zip", cache);
    }
  }
  static async uploadCacheBook(key: string) {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let service = ConfigService.getItem("defaultSyncOption");
      if (!service) {
        return;
      }
      let tokenConfig = await getCloudConfig(service);

      await ipcRenderer.invoke("cloud-upload", {
        ...tokenConfig,
        fileName: "cache-" + key + ".zip",
        service: service,
        type: "book",
        storagePath: getStorageLocation(),
      });
    } else {
      let syncUtil = await SyncService.getSyncUtil();
      let bookBuffer: any = await this.fetchBook(
        "cache-" + key,
        "zip",
        true,
        ""
      );
      let bookBlob = new Blob([bookBuffer], {
        type: "application/zip",
      });
      await syncUtil.uploadFile("cache-" + key + ".zip", "book", bookBlob);
    }
  }
  static async downloadBook(key: string, format: string) {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let service = ConfigService.getItem("defaultSyncOption");
      if (!service) {
        return;
      }
      let tokenConfig = await getCloudConfig(service);

      await ipcRenderer.invoke("cloud-download", {
        ...tokenConfig,
        fileName: key + "." + format.toLowerCase(),
        service: service,
        type: "book",
        storagePath: getStorageLocation(),
      });
    } else {
      let syncUtil = await SyncService.getSyncUtil();
      let bookBuffer = await syncUtil.downloadFile(
        key + "." + format.toLowerCase(),
        "book"
      );
      await this.addBook(key, format, bookBuffer);
    }
  }
  static async uploadBook(key: string, format: string) {
    let isAuthed = await TokenService.getToken("is_authed");
    if (isAuthed !== "yes") {
      return;
    }
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let service = ConfigService.getItem("defaultSyncOption");
      if (!service) {
        return;
      }
      let tokenConfig = await getCloudConfig(service);

      await ipcRenderer.invoke("cloud-upload", {
        ...tokenConfig,
        fileName: key + "." + format.toLowerCase(),
        service: service,
        type: "book",
        storagePath: getStorageLocation(),
      });
    } else {
      let syncUtil = await SyncService.getSyncUtil();
      let bookBuffer: any = await this.fetchBook(key, format, true, "");
      let bookBlob = new Blob([bookBuffer], {
        type: CommonTool.getMimeType(format.toLowerCase()),
      });
      await syncUtil.uploadFile(
        key + "." + format.toLowerCase(),
        "book",
        bookBlob
      );
    }
  }
  static async deleteCloudBook(key: string, format: string) {
    let isAuthed = await TokenService.getToken("is_authed");
    if (isAuthed !== "yes") {
      return;
    }
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let service = ConfigService.getItem("defaultSyncOption");
      if (!service) {
        return;
      }
      let tokenConfig = await getCloudConfig(service);

      await ipcRenderer.invoke("cloud-delete", {
        ...tokenConfig,
        fileName: key + "." + format.toLowerCase(),
        service: service,
        type: "book",
        storagePath: getStorageLocation(),
      });
    } else {
      let syncUtil = await SyncService.getSyncUtil();
      await syncUtil.deleteFile(key + "." + format.toLowerCase(), "book");
    }
  }

  static async deleteCacheBook(key: string) {
    await this.deleteBook("cache-" + key, "zip");
  }
  static async offlineBook(key: string, _format: string) {
    await this.downloadCacheBook(key);
  }
  static async deleteOfflineBook(key: string) {
    let book: Book = await DatabaseService.getRecord(key, "books");
    await this.deleteBook(key, book.format.toLowerCase());
    await this.deleteCacheBook(key);
  }
  static async isBookOffline(key: string) {
    let book: Book = await DatabaseService.getRecord(key, "books");
    return await this.isBookExist(key, book.format.toLowerCase(), "");
  }
  static async getLocalBookList() {
    let books: Book[] = (await DatabaseService.getAllRecords("books")) || [];
    let fileList: string[] = [];
    for (let book of books) {
      if (await this.isBookExist(book.key, book.format.toLowerCase(), "")) {
        fileList.push(book.key + "." + book.format.toLowerCase());
      }
      if (await this.isBookExist("cache-" + book.key, "zip", "")) {
        fileList.push("cache-" + book.key + ".zip");
      }
    }
    return fileList;
  }
  static async getCloudBookList() {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let service = ConfigService.getItem("defaultSyncOption");
      if (!service) {
        return [];
      }
      let tokenConfig = await getCloudConfig(service);

      return await ipcRenderer.invoke("cloud-list", {
        ...tokenConfig,
        service: service,
        type: "book",
        storagePath: getStorageLocation(),
      });
    } else {
      let syncUtil = await SyncService.getSyncUtil();
      let cloudBookList = await syncUtil.listFiles("book");
      return cloudBookList;
    }
  }
}

export default BookUtil;
