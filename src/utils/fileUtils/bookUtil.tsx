import OtherUtil from "../otherUtil";
import { isElectron } from "react-device-detect";
import localforage from "localforage";
import BookModel from "../../model/Book";

class BookUtil {
  static addBook(key: string, buffer: ArrayBuffer) {
    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const dataPath = localStorage.getItem("storageLocation")
        ? localStorage.getItem("storageLocation")
        : window
            .require("electron")
            .ipcRenderer.sendSync("storage-location", "ping");
      return new Promise<void>((resolve, reject) => {
        var reader = new FileReader();
        reader.readAsArrayBuffer(new Blob([buffer]));
        reader.onload = async (event) => {
          if (!event.target) return;
          try {
            fs.writeFileSync(
              path.join(dataPath, "book", key),
              Buffer.from(event.target.result as any)
            );
            resolve();
          } catch (error) {
            reject();
            throw error;
          }
        };
        reader.onerror = () => {
          reject();
        };
      });
    } else {
      return localforage.setItem(key, buffer);
    }
  }
  static deleteBook(key: string) {
    if (isElectron) {
      const fs = window.require("fs-extra");
      const path = window.require("path");
      const dataPath = localStorage.getItem("storageLocation")
        ? localStorage.getItem("storageLocation")
        : window
            .require("electron")
            .ipcRenderer.sendSync("storage-location", "ping");
      return new Promise<void>((resolve, reject) => {
        try {
          fs.remove(path.join(dataPath, `book`, key), (err) => {
            if (err) throw err;
            resolve();
          });
        } catch (e) {
          reject();
        }
      });
    } else {
      return localforage.removeItem(key);
    }
  }
  static fetchBook(
    key: string,
    isArrayBuffer: boolean = false,
    bookPath: string = ""
  ) {
    if (isElectron) {
      return new Promise<File | ArrayBuffer | boolean>((resolve, reject) => {
        var fs = window.require("fs");
        var path = window.require("path");
        let _bookPath = path.join(
          localStorage.getItem("storageLocation")
            ? localStorage.getItem("storageLocation")
            : window
                .require("electron")
                .ipcRenderer.sendSync("storage-location", "ping"),
          `book`,
          key
        );
        var data;
        if (bookPath && fs.existsSync(bookPath)) {
          data = fs.readFileSync(bookPath);
        } else if (fs.existsSync(_bookPath)) {
          data = fs.readFileSync(_bookPath);
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
  static async RedirectBook(book: BookModel) {
    let ref =
      book.description === "readonly" || book.description === "pdf"
        ? book.format.toLowerCase()
        : "epub";

    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.invoke("open-book", {
        url: `${window.location.href.split("#")[0]}#/${ref}/${book.key}`,
        isMergeWord: OtherUtil.getReaderConfig("isMergeWord"),
        isFullscreen: OtherUtil.getReaderConfig("isAutoFullscreen"),
        isPreventSleep: OtherUtil.getReaderConfig("isPreventSleep"),
      });
    } else {
      window.open(
        `${window.location.href.split("#")[0]}#/${ref}/${book.key}?title=${
          book.name
        }`
      );
    }
  }
  static getBookUrl(book: BookModel) {
    let ref =
      book.description === "readonly" || book.description === "pdf"
        ? book.format.toLowerCase()
        : "epub";
    return `/${ref}/${book.key}`;
  }
  static getPDFUrl(book: BookModel) {
    if (isElectron) {
      const path = window.require("path");
      const { ipcRenderer } = window.require("electron");
      localStorage.setItem("pdfPath", book.path);
      const __dirname = ipcRenderer.sendSync("get-dirname", "ping");
      let pdfLocation =
        document.URL.indexOf("localhost") > -1
          ? "http://localhost:3000/"
          : `file://${path.join(
              __dirname,
              "./build",
              "lib",
              "pdf",
              "web",
              "viewer.html"
            )}`;
      let url = `${
        window.navigator.platform.indexOf("Win") > -1
          ? "lib/pdf/web/"
          : "lib\\pdf\\web\\"
      }viewer.html?file=${book.key}`;
      return document.URL.indexOf("localhost") > -1
        ? pdfLocation + url
        : `${pdfLocation}?file=${book.key}`;
    } else {
      return `./lib/pdf/web/viewer.html?file=${book.key}`;
    }
  }
  static generateBook(
    bookName: string,
    extension: string,
    md5: string,
    size: number,
    path: string
  ) {
    let cover: any = "noCover";
    let key: string,
      name: string,
      author: string,
      publisher: string,
      description: string,
      charset: string,
      content: string;
    [name, author, description, publisher, charset, content] = [
      bookName,
      "Unknown Authur",
      "readonly",
      "",
      "",
      "",
    ];
    let format = extension.toUpperCase();
    key = new Date().getTime() + "";
    return new BookModel(
      key,
      name,
      author,
      description,
      md5,
      cover,
      format,
      publisher,
      size,
      path,
      charset,
      content
    );
  }
}

export default BookUtil;
