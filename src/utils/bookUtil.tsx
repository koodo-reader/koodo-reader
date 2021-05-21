import OtherUtil from "./otherUtil";
import { isElectron } from "react-device-detect";
import localforage from "localforage";
import BookModel from "../model/Book";
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
          try {
            fs.writeFileSync(
              path.join(dataPath, "book", key),
              Buffer.from(event.target!.result as any)
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
  static fetchBook(key: string, isArrayBuffer: boolean = false) {
    if (isElectron) {
      return new Promise<File | ArrayBuffer>((resolve, reject) => {
        var fs = window.require("fs");
        var path = window.require("path");
        var data = fs.readFileSync(
          path.join(
            localStorage.getItem("storageLocation")
              ? localStorage.getItem("storageLocation")
              : window
                  .require("electron")
                  .ipcRenderer.sendSync("storage-location", "ping"),
            `book`,
            key
          )
        );
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

  static openBook(book: BookModel) {
    let ref =
      book.description === "readonly" ? book.format.toLowerCase() : "epub";
    if (OtherUtil.getReaderConfig("isAutoFullscreen") === "yes") {
      if (isElectron) {
        const { ipcRenderer } = window.require("electron");
        ipcRenderer.sendSync(
          "open-book",
          `${window.location.href.split("#")[0]}#/${ref}/${book.key}?width=full`
        );
      } else {
        window.open(
          `${window.location.href.split("#")[0]}#/${ref}/${book.key}?width=full`
        );
      }
    } else {
      if (isElectron) {
        const { ipcRenderer } = window.require("electron");
        ipcRenderer.sendSync(
          "open-book",
          `${window.location.href.split("#")[0]}#/${ref}/${
            book.key
          }?width=${OtherUtil.getReaderConfig(
            "windowWidth"
          )}&height=${OtherUtil.getReaderConfig(
            "windowHeight"
          )}&x=${OtherUtil.getReaderConfig(
            "windowX"
          )}&y=${OtherUtil.getReaderConfig("windowY")}`
        );
      } else {
        window.open(
          `${window.location.href.split("#")[0]}#/${ref}/${
            book.key
          }?width=${OtherUtil.getReaderConfig(
            "windowWidth"
          )}&height=${OtherUtil.getReaderConfig(
            "windowHeight"
          )}&x=${OtherUtil.getReaderConfig(
            "windowX"
          )}&y=${OtherUtil.getReaderConfig("windowY")}`
        );
      }
    }
  }
  static async RedirectBook(book: BookModel) {
    if (book.description === "pdf") {
      if (isElectron) {
        const { ipcRenderer } = window.require("electron");
        const file: any = await this.fetchBook(book.key);
        var reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async (event) => {
          await localforage.setItem("pdf", event.target!.result as any);
          if (OtherUtil.getReaderConfig("isAutoFullscreen") === "yes") {
            ipcRenderer.sendSync(
              "open-book",
              `${
                window.navigator.platform.indexOf("Win") > -1
                  ? "lib/pdf/web/"
                  : "lib\\pdf\\web\\"
              }viewer.html?file=pdf&width=full`
            );
          } else {
            ipcRenderer.sendSync(
              "open-book",
              `${
                window.navigator.platform.indexOf("Win") > -1
                  ? "lib/pdf/web/"
                  : "lib\\pdf\\web\\"
              }viewer.html?file=pdf&width=${OtherUtil.getReaderConfig(
                "windowWidth"
              )}&height=${OtherUtil.getReaderConfig(
                "windowHeight"
              )}&x=${OtherUtil.getReaderConfig(
                "windowX"
              )}&y=${OtherUtil.getReaderConfig("windowY")}`
            );
          }
        };
      } else {
        window.open(`./lib/pdf/web/viewer.html?file=${book.key}`);
      }
    } else {
      this.openBook(book);
    }
  }
  static generateBook(bookName: string, extension: string, md5: string) {
    let cover: any = "noCover";
    let key: string,
      name: string,
      author: string,
      publisher: string,
      description: string;
    [name, author, description, publisher] = [
      bookName,
      "Unknown Authur",
      "readonly",
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
      publisher
    );
  }
}

export default BookUtil;
