import ConfigService from "../storage/configService";
import { isElectron } from "react-device-detect";
import localforage from "localforage";
import BookModel from "../../models/Book";
import toast from "react-hot-toast";
import { getStorageLocation } from "../common";
import { Buffer } from "buffer";
declare var window: any;

class BookUtil {
  static addBook(key: string, foramt: string, buffer: ArrayBuffer) {
    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const dataPath = getStorageLocation() || "";
      try {
        if (!fs.existsSync(path.join(dataPath, "book"))) {
          fs.mkdirSync(path.join(dataPath, "book"), { recursive: true });
        }
        fs.writeFileSync(
          path.join(dataPath, "book", key + "." + foramt),
          Buffer.from(buffer)
        );
      } catch (error) {
        throw error;
      }
    } else {
      return localforage.setItem(key, buffer);
    }
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
              resolve();
            }
          );
        } catch (e) {
          reject();
        }
      });
    } else {
      return localforage.removeItem(key);
    }
  }
  static isBookExist(key: string, format: string, bookPath: string) {
    return new Promise<boolean>((resolve, reject) => {
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
      return new Promise<File | ArrayBuffer | boolean>((resolve, reject) => {
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
      return localforage.getItem(key);
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
  static async redirectBook(book: BookModel, t: (string) => string) {
    if (
      !(await this.isBookExist(book.key, book.format.toLowerCase(), book.path))
    ) {
      toast.error(t("Book not exist"));
      return;
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
}

export default BookUtil;
