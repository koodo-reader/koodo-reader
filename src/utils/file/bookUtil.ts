import {
  ConfigService,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import localforage from "localforage";
import BookModel from "../../models/Book";
import toast from "react-hot-toast";
import { getStorageLocation, showDownloadProgress } from "../common";
import { Buffer } from "buffer";
import SyncService from "../storage/syncService";
import { CommonTool } from "../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../storage/databaseService";
import Book from "../../models/Book";
import i18n from "../../i18n";
import { getCloudConfig } from "./common";
import CoverUtil from "./coverUtil";
import { LocalFileManager } from "./localFile";
declare var window: any;

class BookUtil {
  static async addBook(key: string, format: string, buffer: ArrayBuffer) {
    // for both original books and cached boks

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
        this.uploadBook(key, format);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error(errorMessage);
        throw error;
      }
    } else {
      if (ConfigService.getReaderConfig("isUseLocal") === "yes") {
        await LocalFileManager.saveFile(key + "." + format, buffer, "book");
      } else {
        await localforage.setItem(key, buffer);
      }

      this.uploadBook(key, format);
    }
  }
  static deleteBook(key: string, format: string) {
    try {
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
        if (ConfigService.getReaderConfig("isUseLocal") === "yes") {
          return LocalFileManager.deleteFile(key + "." + format, "book");
        } else {
          return localforage.removeItem(key);
        }
      }
    } catch (error) {
      console.error("delete book error:", error);
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
        if (ConfigService.getReaderConfig("isUseLocal") === "yes") {
          LocalFileManager.fileExists(key + "." + format, "book").then(
            (exists) => {
              resolve(exists);
            }
          );
        } else {
          localforage.getItem(key).then((result) => {
            if (result) {
              resolve(true);
            } else {
              resolve(false);
            }
          });
        }
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
      if (ConfigService.getReaderConfig("isUseLocal") === "yes") {
        return LocalFileManager.readFile(
          key + "." + format,
          "book"
        ) as Promise<ArrayBuffer>;
      } else {
        return localforage.getItem(key) as Promise<ArrayBuffer>;
      }
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
      !(await this.isBookExist(
        book.key,
        book.format.toLowerCase(),
        book.path
      )) &&
      !(await this.isBookExist("cache-" + book.key, "zip", book.path))
    ) {
      if (!ConfigService.getItem("defaultSyncOption")) {
        toast(i18n.t("Please add data source in the setting"));
        return;
      }
      toast.loading(i18n.t("Downloading"), {
        id: "offline-book",
      });
      if (
        (await TokenService.getToken("is_authed")) === "yes" &&
        (await this.isBookExistInCloud(book.key))
      ) {
        let timer = showDownloadProgress(
          ConfigService.getItem("defaultSyncOption") || "",
          "cloud",
          book.size
        );
        let result = await this.downloadBook(book.key, book.format);
        clearInterval(timer);
        toast.dismiss("offline-book");

        let covers = await CoverUtil.getCloudCoverList();
        for (let cover of covers) {
          if (cover.startsWith(book.key)) {
            await CoverUtil.downloadCover(cover);
          }
        }

        if (result) {
          toast.success(i18n.t("Download successful"), {
            id: "offline-book",
          });
        } else {
          let result = await this.downloadCacheBook(book.key);
          if (result) {
            toast.success(i18n.t("Download successful"), {
              id: "offline-book",
            });
          } else {
            toast.error(i18n.t("Download failed"), {
              id: "offline-book",
            });
            if (ConfigService.getItem("defaultSyncOption") === "adrive") {
              toast.error(
                i18n.t(
                  "Aliyun Drive imposes strict limits on concurrent downloads. It is recommended that you wait 10 seconds before attempting to download again."
                ),
                {
                  id: "offline-book",
                }
              );
            }
            return;
          }
        }
      } else {
        toast.error(i18n.t("Book not exists"), {
          id: "offline-book",
        });
        return;
      }
    }
    let ref = book.format.toLowerCase();

    if (isElectron) {
      if (ConfigService.getReaderConfig("isOpenInMain") === "yes") {
        window.require("electron").ipcRenderer.invoke("new-tab", {
          url: `${window.location.href.split("#")[0]}#/${ref}/${book.key
            }?title=${book.name}&file=${book.key}`,
        });
      } else {
        const { ipcRenderer } = window.require("electron");
        ipcRenderer.invoke("open-book", {
          url: `${window.location.href.split("#")[0]}#/${ref}/${book.key
            }?title=${book.name}&file=${book.key}`,
          isMergeWord: ConfigService.getReaderConfig("isMergeWord"),
          isAutoFullscreen: ConfigService.getReaderConfig("isAutoFullscreen"),
          isPreventSleep: ConfigService.getReaderConfig("isPreventSleep"),
          isAlwaysOnTop: ConfigService.getReaderConfig("isAlwaysOnTop"),
        });
      }
    } else {
      window.open(
        `${window.location.href.split("#")[0]}#/${ref}/${book.key}?title=${book.name
        }&file=${book.key}`
      );
    }
  }
  static getBookUrl(book: BookModel) {
    let ref = book.format.toLowerCase();
    return `/${ref}/${book.key}`;
  }
  static reloadBooks(currentBook: BookModel) {
    if (isElectron) {
      if (ConfigService.getReaderConfig("isOpenInMain") === "yes") {
        window
          .require("electron")
          .ipcRenderer.invoke("reload-tab", { bookKey: currentBook.key });
      } else {
        window.require("electron").ipcRenderer.invoke("reload-reader", {
          bookKey: currentBook.key,
        });
      }
    } else {
      window.location.reload();
    }
  }
  static async isBookExistInCloud(key: string) {
    let service = ConfigService.getItem("defaultSyncOption");
    if (!service) {
      return false;
    }
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");

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
    let service = ConfigService.getItem("defaultSyncOption");
    if (!service) {
      return false;
    }
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");

      let tokenConfig = await getCloudConfig(service);

      let result = await ipcRenderer.invoke("cloud-download", {
        ...tokenConfig,
        fileName: "cache-" + key + ".zip",
        service: service,
        type: "book",
        storagePath: getStorageLocation(),
      });
      if (!result) {
        console.error("download cache failed");
        return false;
      }
      return true;
    } else {
      let syncUtil = await SyncService.getSyncUtil();
      let cache = await syncUtil.downloadFile("cache-" + key + ".zip", "book");
      if (!cache) {
        console.error("download cache failed");
        return false;
      }
      await this.addBook("cache-" + key, "zip", cache);
      return true;
    }
  }
  static async downloadBook(key: string, format: string) {
    let service = ConfigService.getItem("defaultSyncOption");
    if (!service) {
      return;
    }
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");

      let tokenConfig = await getCloudConfig(service);

      let result = await ipcRenderer.invoke("cloud-download", {
        ...tokenConfig,
        fileName: key + "." + format.toLowerCase(),
        service: service,
        type: "book",
        storagePath: getStorageLocation(),
      });
      return result;
    } else {
      let syncUtil = await SyncService.getSyncUtil();
      let bookBuffer = await syncUtil.downloadFile(
        key + "." + format.toLowerCase(),
        "book"
      );
      if (!bookBuffer) {
        return false;
      }
      await this.addBook(key, format, bookBuffer);
      return true;
    }
  }
  static async uploadBook(key: string, format: string) {
    if (key.startsWith("cache")) {
      return;
    }
    let isAuthed = await TokenService.getToken("is_authed");
    if (isAuthed !== "yes") {
      return;
    }
    let service = ConfigService.getItem("defaultSyncOption");
    if (!service) {
      return;
    }
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");

      let tokenConfig = await getCloudConfig(service);
      let result = await ipcRenderer.invoke("cloud-upload", {
        ...tokenConfig,
        fileName: key + "." + format.toLowerCase(),
        service: service,
        type: "book",
        storagePath: getStorageLocation(),
      });
      if (!result) {
        toast.error(i18n.t("Upload failed"), {
          id: "upload-book",
        });
        return;
      }
    } else {
      let syncUtil = await SyncService.getSyncUtil();
      let bookBuffer: any = await this.fetchBook(key, format, true, "");
      let bookBlob = new Blob([bookBuffer], {
        type: CommonTool.getMimeType(format.toLowerCase()),
      });
      let result = await syncUtil.uploadFile(
        key + "." + format.toLowerCase(),
        "book",
        bookBlob
      );
      if (!result) {
        toast.error(i18n.t("Upload failed"), {
          id: "upload-book",
        });
        return;
      }
    }
  }
  static async deleteCloudBook(key: string, format: string) {
    let isAuthed = await TokenService.getToken("is_authed");
    if (isAuthed !== "yes") {
      return;
    }
    let service = ConfigService.getItem("defaultSyncOption");
    if (!service) {
      return;
    }
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");

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
  static async offlineBook(key: string, format: string) {
    let result = await this.downloadBook(key, format);
    if (!result) {
      result = await this.downloadCacheBook(key);
    }
    return result;
  }
  static async deleteOfflineBook(key: string) {
    let book: Book = await DatabaseService.getRecord(key, "books");
    if (!book) {
      return;
    }
    await this.deleteBook(key, book.format.toLowerCase());
    await this.deleteCacheBook(key);
    await CoverUtil.deleteOfflineCover(key);
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
    let service = ConfigService.getItem("defaultSyncOption");
    if (!service) {
      return [];
    }
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");

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
  static async getBookNamesMapByKeys(bookKeys: string[]) {
    if (bookKeys.length === 0) {
      return {};
    }
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let placeholders = bookKeys.map(() => "?").join(",");
      let query = `SELECT key, name FROM books WHERE key IN (${placeholders})`;
      let results = await ipcRenderer.invoke("custom-database-command", {
        query: query,
        data: bookKeys,
        dbName: "books",
        storagePath: getStorageLocation(),
        executeType: "all",
      });
      let map: { [key: string]: string } = {};
      for (let item of results) {
        map[item.key] = item.name;
      }
      return map;
    } else {
      let books: Book[] = (await DatabaseService.getAllRecords("books")) || [];
      let map: { [key: string]: string } = {};
      for (let book of books) {
        if (bookKeys.includes(book.key)) {
          map[book.key] = book.name;
        }
      }
      return map;
    }
  }
  static async getBookKeysWithSort(sortField: string, orderField: string) {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      // Get all books first, then sort in JavaScript for natural sorting
      let results = await ipcRenderer.invoke("custom-database-command", {
        query: `SELECT key, ${sortField} FROM books`,
        dbName: "books",
        storagePath: getStorageLocation(),
        executeType: "all",
      });

      if (sortField === "name" || sortField === "author") {
        results.sort((a: any, b: any) => {
          const comparison = a[sortField].localeCompare(b[sortField], undefined, { numeric: true, sensitivity: "base" });
          return orderField === "ASC" ? comparison : -comparison;
        });
      } else if (sortField === "key") {
        if (orderField === "DESC") {
          results = results.reverse();
        }
      }

      return results.map((item: any) => ({ key: item.key }));
    } else {
      let books: Book[] = (await DatabaseService.getAllRecords("books")) || [];
      if (sortField === "name") {
        books.sort((a, b) => {
          const comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
          return orderField === "ASC" ? comparison : -comparison;
        });
        return books.map((item) => {
          return { key: item.key };
        });
      } else if (sortField === "author") {
        books.sort((a, b) => {
          const comparison = a.author.localeCompare(b.author, undefined, { numeric: true, sensitivity: "base" });
          return orderField === "ASC" ? comparison : -comparison;
        });
        return books.map((item) => {
          return { key: item.key };
        });
      } else if (sortField === "key") {
        if (orderField === "DESC") {
          books = books.reverse();
        }
        return books.map((item) => {
          return { key: item.key };
        });
      }
    }
  }
  static async getBookByMd5(md5: string) {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      return await ipcRenderer.invoke("custom-database-command", {
        query: `SELECT * FROM books WHERE md5=? LIMIT 1`,
        data: [md5],
        dbName: "books",
        storagePath: getStorageLocation(),
        executeType: "get",
      });
    } else {
      let books: Book[] = (await DatabaseService.getAllRecords("books")) || [];
      for (let book of books) {
        if (book.md5 === md5) {
          return book;
        }
      }
      return null;
    }
  }
  static async searchBooksByKeyword(keyword: string) {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      return await ipcRenderer.invoke("custom-database-command", {
        query: `SELECT * FROM books WHERE name LIKE ? OR author LIKE ?`,
        data: [`%${keyword}%`, `%${keyword}%`],
        dbName: "books",
        storagePath: getStorageLocation(),
        executeType: "all",
      });
    } else {
      let books: Book[] = (await DatabaseService.getAllRecords("books")) || [];
      let results: Book[] = [];
      const lowerKeyword = keyword.toLowerCase();
      for (let book of books) {
        if (
          book.name.toLowerCase().includes(lowerKeyword) ||
          book.author.toLowerCase().includes(lowerKeyword)
        ) {
          results.push(book);
        }
      }
      return results;
    }
  }
  static async getBookList() {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      return await ipcRenderer.invoke("custom-database-command", {
        query: `SELECT key, format, md5 FROM books`,
        dbName: "books",
        storagePath: getStorageLocation(),
        executeType: "all",
      });
    } else {
      let books: Book[] = (await DatabaseService.getAllRecords("books")) || [];
      return books;
    }
  }
}

export default BookUtil;
