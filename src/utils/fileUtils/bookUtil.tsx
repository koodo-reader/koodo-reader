import StorageUtil from "../serviceUtils/storageUtil";
import { isElectron } from "react-device-detect";

import BookModel from "../../model/Book";
import toast from "react-hot-toast";
import { getPDFMetadata } from "./pdfUtil";
import { copyArrayBuffer } from "../commonUtil";
import iconv from "iconv-lite";
import { Buffer } from "buffer";
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
      return window.localforage.setItem(key, buffer);
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
      return window.localforage.removeItem(key);
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
        window.localforage.getItem(key).then((result) => {
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
      return window.localforage.getItem(key);
    }
  }
  static FetchAllBooks(Books: BookModel[]) {
    return Books.map((item) => {
      return this.fetchBook(item.key, true, item.path);
    });
  }
  static async RedirectBook(
    book: BookModel,
    t: (string) => string,
    history: any
  ) {
    if (!(await this.isBookExist(book.key, book.path))) {
      toast.error(t("Book not exist"));
      return;
    }
    let ref = book.format.toLowerCase();

    if (isElectron) {
      if (StorageUtil.getReaderConfig("isOpenInMain") === "yes") {
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
          isMergeWord:
            book.format === "PDF"
              ? "no"
              : StorageUtil.getReaderConfig("isMergeWord"),
          isAutoFullscreen: StorageUtil.getReaderConfig("isAutoFullscreen"),
          isPreventSleep: StorageUtil.getReaderConfig("isPreventSleep"),
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
  static reloadBooks() {
    if (isElectron) {
      if (StorageUtil.getReaderConfig("isOpenInMain") === "yes") {
        window.require("electron").ipcRenderer.invoke("reload-tab", "ping");
      } else {
        window.require("electron").ipcRenderer.invoke("reload-reader", "ping");
      }
    } else {
      window.location.reload();
    }
  }
  static getRendtion = (
    result: ArrayBuffer,
    format: string,
    readerMode: string,
    charset: string
  ) => {
    let rendition;
    if (format === "CACHE") {
      rendition = new window.Kookit.CacheRender(result, readerMode);
    } else if (format === "MOBI" || format === "AZW3" || format === "AZW") {
      rendition = new window.Kookit.MobiRender(result, readerMode);
    } else if (format === "EPUB") {
      rendition = new window.Kookit.EpubRender(result, readerMode);
    } else if (format === "TXT") {
      let text = iconv.decode(Buffer.from(result), charset || "utf8");
      rendition = new window.Kookit.TxtRender(text, readerMode);
    } else if (format === "MD") {
      rendition = new window.Kookit.MdRender(result, readerMode);
    } else if (format === "FB2") {
      rendition = new window.Kookit.Fb2Render(result, readerMode);
    } else if (format === "DOCX") {
      rendition = new window.Kookit.DocxRender(result, readerMode);
    } else if (
      format === "HTML" ||
      format === "XHTML" ||
      format === "MHTML" ||
      format === "HTM" ||
      format === "XML"
    ) {
      rendition = new window.Kookit.HtmlRender(result, readerMode, format);
    } else if (
      format === "CBR" ||
      format === "CBT" ||
      format === "CBZ" ||
      format === "CB7"
    ) {
      rendition = new window.Kookit.ComicRender(
        copyArrayBuffer(result),
        readerMode,
        format
      );
    }
    return rendition;
  };
  static generateBook(
    bookName: string,
    extension: string,
    md5: string,
    size: number,
    path: string,
    file_content: ArrayBuffer
  ) {
    return new Promise<BookModel | string>(async (resolve, reject) => {
      try {
        let cover: any = "";
        let key: string,
          name: string,
          author: string,
          publisher: string,
          description: string,
          charset: string,
          page: number;
        [name, author, description, publisher, charset, page] = [
          bookName,
          "Unknown author",
          "",
          "",
          "",
          0,
        ];
        let metadata: any;
        let rendition = BookUtil.getRendtion(
          file_content,
          extension.toUpperCase(),
          "",
          ""
        );

        switch (extension) {
          case "pdf":
            metadata = await getPDFMetadata(copyArrayBuffer(file_content));
            [name, author, publisher, cover, page] = [
              metadata.name || bookName,
              metadata.author || "Unknown author",
              metadata.publisher || "",
              metadata.cover || "",
              metadata.pageCount || 0,
            ];
            if (cover.indexOf("image") === -1) {
              cover = "";
            }
            break;
          case "epub":
            metadata = await rendition.getMetadata();
            if (metadata === "timeout_error") {
              resolve("get_metadata_error");
              break;
            } else if (!metadata.name) {
              break;
            }

            [name, author, description, publisher, cover] = [
              metadata.name || bookName,
              metadata.author || "Unknown author",
              metadata.description || "",
              metadata.publisher || "",
              metadata.cover || "",
            ];
            if (cover.indexOf("image") === -1) {
              cover = "";
            }
            break;
          case "mobi":
          case "azw":
          case "azw3":
            metadata = await rendition.getMetadata();
            [name, author, description, publisher, cover] = [
              metadata.name || bookName,
              metadata.author || "Unknown author",
              metadata.description || "",
              metadata.publisher || "",
              metadata.cover || "",
            ];
            break;
          case "fb2":
            metadata = await rendition.getMetadata();
            [name, author, description, publisher, cover] = [
              metadata.name || bookName,
              metadata.author || "Unknown author",
              metadata.description || "",
              metadata.publisher || "",
              metadata.cover || "",
            ];
            break;
          case "cbr":
          case "cbt":
          case "cbz":
          case "cb7":
            metadata = await rendition.getMetadata();
            cover = metadata.cover;
            break;
          case "txt":
            metadata = await rendition.getMetadata(file_content);
            charset = metadata.charset;
            break;
          default:
            break;
        }
        let format = extension.toUpperCase();
        key = new Date().getTime() + "";
        if (
          StorageUtil.getReaderConfig("isPrecacheBook") === "yes" &&
          extension !== "pdf"
        ) {
          let cache = await rendition.preCache(file_content);
          if (cache !== "err") {
            BookUtil.addBook("cache-" + key, cache);
          }
        }
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
            page,
            path,
            charset
          )
        );
      } catch (error) {
        console.log(error);
        resolve("get_metadata_error");
      }
    });
  }
}

export default BookUtil;
