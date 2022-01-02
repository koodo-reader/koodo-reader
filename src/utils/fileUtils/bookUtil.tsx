import StorageUtil from "../serviceUtils/storageUtil";
import { isElectron } from "react-device-detect";
import localforage from "localforage";
import BookModel from "../../model/Book";
import toast from "react-hot-toast";
import { getPDFCover } from "./pdfUtil";
import chardet from "chardet";
import iconv from "iconv-lite";
import { xmlMetadata } from "./xmlUtil";
// import { base64ArrayBuffer } from "./coverUtil";
declare var window: any;
const { MobiRender, Azw3Render } = window.Kookit;

// let Unrar = window.Unrar;
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
  static async RedirectBook(book: BookModel) {
    if (!(await this.isBookExist(book.key, book.path))) {
      toast.error("Book not exist");
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
    return new Promise<BookModel | boolean>(async (resolve, reject) => {
      let cover: any = "";
      let key: string,
        name: string,
        author: string,
        publisher: string,
        description: string,
        charset: string;
      [name, author, description, publisher, charset] = [
        bookName,
        "Unknown Authur",
        "",
        "",
        "",
      ];
      switch (extension) {
        case "pdf":
          cover = await getPDFCover(file_content);
          break;
        case "mobi":
          let mobiRendition = new MobiRender(
            file_content,
            "scroll",
            StorageUtil.getReaderConfig("isSliding") === "yes" ? true : false
          );
          if (mobiRendition.getMetadata().compression === 17480) {
            resolve(false);
          }
          break;
        case "azw3":
          let azw3Rendition = new Azw3Render(
            file_content,
            "scroll",
            StorageUtil.getReaderConfig("isSliding") === "yes" ? true : false
          );
          if (azw3Rendition.getMetadata().compression === 17480) {
            resolve(false);
          }
          break;
        case "fb2":
          charset = chardet.detect(Buffer.from(file_content)) || "";
          let fb2Str = iconv.decode(
            Buffer.from(file_content),
            charset || "utf8"
          );
          let fb2Obj: any = await xmlMetadata(fb2Str);
          cover = fb2Obj.cover;
          name = fb2Obj.name;
          author = fb2Obj.author;
          break;
        // case "cbr":
        //   let unrar = new Unrar(file_content);
        //   let buffer = unrar.decompress(
        //     unrar.getEntries().map((item: any) => item.name)[0]
        //   );
        //   cover = base64ArrayBuffer(buffer);
        //   break;

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
