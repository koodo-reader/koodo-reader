import axios from "axios";
import { config } from "../constants/driveList";
import OtherUtil from "./otherUtil";
import isElectron from "is-electron";
import localforage from "localforage";
import BookModel from "../model/Book";

class BookUtil {
  static addBook(key: string, buffer: ArrayBuffer) {
    if (isElectron()) {
      return new Promise<void>((resolve, reject) => {
        let formData = new FormData();
        formData.append("file", new Blob([buffer]));
        formData.append("key", key);
        formData.append("path", OtherUtil.getReaderConfig("storageLocation"));
        axios
          .post(`${config.token_url}/add_book`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            responseType: "blob",
          })
          .then(function (response: any) {
            console.log(response, "添加成功");
            resolve();
          })
          .catch(function (error: any) {
            console.error(error, "添加失败");
            reject();
          });
      });
    } else {
      return localforage.setItem(key, buffer);
    }
  }
  static deleteBook(key: string) {
    if (isElectron()) {
      return new Promise<void>((resolve, reject) => {
        axios
          .post(`${config.token_url}/delete_book`, {
            key,
            path: OtherUtil.getReaderConfig("storageLocation"),
          })
          .then(function (response: any) {
            console.log(response, "删除成功");
            resolve();
          })
          .catch(function (error: any) {
            console.error(error, "删除失败");
            reject();
          });
      });
    } else {
      return localforage.removeItem(key);
    }
  }
  static fetchBook(key: string) {
    if (isElectron()) {
      return new Promise<File>((resolve, reject) => {
        const fs = window.require("fs");
        var data = fs.readFileSync(
          OtherUtil.getReaderConfig("storageLocation") + `\\book\\${key}`
        );
        let blobTemp = new Blob([data], { type: "application/epub+zip" });
        let fileTemp = new File([blobTemp], "data.epub", {
          lastModified: new Date().getTime(),
          type: blobTemp.type,
        });
        resolve(fileTemp);
      });
    } else {
      return localforage.getItem(key);
    }
  }
  static async RedirectBook(book: BookModel) {
    if (book.description === "pdf") {
      if (isElectron()) {
        const file: any = await this.fetchBook(book.key);
        file.arrayBuffer().then(async (arrayBuffer) => {
          await localforage.setItem("pdf", arrayBuffer);
          window.open(`./lib/pdf/viewer.html?file=pdf`);
        });
      } else {
        window.open(`./lib/pdf/viewer.html?file=${book.key}`);
      }
    } else {
      window.open(`${window.location.href.split("#")[0]}#/epub/${book.key}`);
    }
  }
}

export default BookUtil;
