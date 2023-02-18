import StorageUtil from "../serviceUtils/storageUtil";
import { isElectron } from "react-device-detect";
import localforage from "localforage";
import BookModel from "../../model/Book";
import toast from "react-hot-toast";
import { getPDFCover } from "./pdfUtil";
import { copyArrayBuffer } from "../commonUtil";
declare var window: any;

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
            if (!fs.existsSync(path.join(dataPath, "book"))) {
              fs.mkdirSync(path.join(dataPath, "book"));
            }
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
      const fs_extra = window.require("fs-extra");
      const path = window.require("path");
      const dataPath = localStorage.getItem("storageLocation")
        ? localStorage.getItem("storageLocation")
        : window
            .require("electron")
            .ipcRenderer.sendSync("storage-location", "ping");
      return new Promise<void>((resolve, reject) => {
        try {
          fs_extra.remove(path.join(dataPath, `book`, key), (err) => {
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
  static isBookExist(key: string, bookPath: string = "") {
    return new Promise<boolean>((resolve, reject) => {
      if (isElectron) {
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

        if ((bookPath && fs.existsSync(bookPath)) || fs.existsSync(_bookPath)) {
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
  static async RedirectBook(book: BookModel, t: (string) => string) {
    if (!(await this.isBookExist(book.key, book.path))) {
      toast.error(t("Book not exist"));
      return;
    }
    let ref = book.format.toLowerCase();

    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.invoke("open-book", {
        url: `${window.location.href.split("#")[0]}#/${ref}/${book.key}`,
        isMergeWord:
          book.format === "PDF" || book.format === "DJVU"
            ? "no"
            : StorageUtil.getReaderConfig("isMergeWord"),
        isFullscreen: StorageUtil.getReaderConfig("isAutoFullscreen"),
        isPreventSleep: StorageUtil.getReaderConfig("isPreventSleep"),
      });
    } else {
      if (ref === "rtf") {
        toast(
          t(
            "Koodo Reader's web version are limited by the browser, for more powerful features, please download the desktop version."
          )
        );
        return;
      }
      window.open(
        `${window.location.href.split("#")[0]}#/${ref}/${book.key}?title=${
          book.name
        }`
      );
    }
  }
  static getBookUrl(book: BookModel) {
    let ref = book.format.toLowerCase();
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
    path: string,
    file_content: ArrayBuffer
  ) {
    const { MobiRender, EpubRender, Fb2Render, ComicRender } = window.Kookit;
    return new Promise<BookModel | string>(async (resolve, reject) => {
      let cover: any = "";
      let key: string,
        name: string,
        author: string,
        publisher: string,
        description: string,
        charset: string;
      [name, author, description, publisher, charset] = [
        bookName,
        "Unknown Author",
        "",
        "",
        "",
      ];
      let metadata: any;
      let rendition: any;
      switch (extension) {
        case "pdf":
          cover = await getPDFCover(file_content);
          if (cover.indexOf("image") === -1) {
            cover = "";
          }
          break;
        case "epub":
          rendition = new EpubRender(file_content, "scroll");
          metadata = await rendition.getMetadata();
          if (metadata === "timeout_error") {
            resolve("get_metadata_error");
            break;
          } else if (!metadata.name) {
            break;
          }

          [name, author, description, publisher, cover] = [
            metadata.name,
            metadata.author,
            metadata.description,
            metadata.publisher,
            metadata.cover,
          ];
          if (cover.indexOf("image") === -1) {
            cover = "";
          }
          break;
        case "mobi":
        case "azw":
        case "azw3":
          rendition = new MobiRender(file_content, "scroll");
          metadata = await rendition.getMetadata();
          [name, author, description, publisher, cover] = [
            metadata.name,
            metadata.author,
            metadata.description,
            metadata.publisher,
            metadata.cover,
          ];
          break;
        case "fb2":
          rendition = new Fb2Render(file_content, "scroll");
          metadata = await rendition.getMetadata();
          [name, author, description, publisher, cover] = [
            metadata.name,
            metadata.author,
            metadata.description,
            metadata.publisher,
            metadata.cover,
          ];
          break;
        case "cbr":
        case "cbt":
        case "cbz":
        case "cb7":
          rendition = new ComicRender(
            copyArrayBuffer(file_content),
            "scroll",
            extension.toUpperCase()
          );
          metadata = await rendition.getMetadata();
          cover = metadata.cover;
          break;
        default:
          break;
      }
      let format = extension.toUpperCase();
      key = new Date().getTime() + "";
      resolve(
        new BookModel(
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
          charset
        )
      );
    });
  }
}

export default BookUtil;
