import BookModel from "../../models/Book";

import BookUtil from "../fileUtils/bookUtil";
import NoteModel from "../../models/Note";
import BookmarkModel from "../../models/Bookmark";
import { isElectron } from "react-device-detect";
declare var window: any;

let configArr = [
  "notes.json",
  "books.json",
  "bookmarks.json",
  "readerConfig.json",
  "noteTags.json",
  "themeColors.json",
  "bookSortCode.json",
  "noteSortCode.json",
  "readingTime.json",
  "recentBooks.json",
  "favoriteBooks.json",
  "favoriteBooks.json",
  "shelfList.json",
  "pdfjs.history.json",
  "recordLocation.json",
];
export function getParamsFromUrl() {
  var hashParams: any = {};
  var e,
    r = /([^&;=]+)=?([^&;]*)/g,
    q =
      window.location.hash.substring(2) ||
      window.location.search.substring(1).split("#")[0];

  while ((e = r.exec(q))) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}
//移动文件到指定路径
export const moveData = (
  blob,
  driveIndex,
  books: BookModel[] = [],
  handleFinish: () => void = () => {}
) => {
  let file = new File([blob], "config.zip", {
    lastModified: new Date().getTime(),
    type: blob.type,
  });
  const fs = window.require("fs");
  const path = window.require("path");
  const AdmZip = window.require("adm-zip");

  const { ipcRenderer } = window.require("electron");
  const dirPath = ipcRenderer.sendSync("user-data", "ping");
  const dataPath = localStorage.getItem("storageLocation")
    ? localStorage.getItem("storageLocation")
    : window
        .require("electron")
        .ipcRenderer.sendSync("storage-location", "ping");
  var reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = async (event) => {
    if (!event.target) return;
    if (!fs.existsSync(path.join(dirPath))) {
      fs.mkdirSync(path.join(dirPath));
    }
    fs.writeFileSync(
      path.join(dirPath, file.name),
      Buffer.from(event.target.result as any)
    );
    var zip = new AdmZip(path.join(dirPath, file.name));
    zip.extractAllTo(/*target path*/ dataPath, /*overwrite*/ true);
    const fs_extra = window.require("fs-extra");
    fs_extra.copy(
      path.join(dirPath, file.name),
      path.join(dataPath, file.name),
      function (err) {
        if (err) return;
      }
    );
    if (driveIndex === 4) {
      let deleteBooks = books.map((item) => {
        return window.localforage.removeItem(item.key);
      });
      await Promise.all(deleteBooks);
    }
    if (driveIndex === 5) {
      handleFinish();
    }
  };
};
//改变数据存储路径
export const changePath = (oldPath: string, newPath: string) => {
  return new Promise<number>((resolve, reject) => {
    const fs = window.require("fs-extra");
    try {
      fs.readdir(newPath, (err, files: string[]) => {
        let isConfiged: boolean = false;
        files.forEach((file: string) => {
          if (file === "config.zip") {
            isConfiged = true;
          }
        });
        if (isConfiged) {
          localStorage.setItem("storageLocation", newPath);
          resolve(1);
        } else {
          fs.copy(oldPath, newPath, function (err) {
            if (err) return;
            fs.emptyDirSync(oldPath);
            resolve(2);
          });
        }
      });
    } catch (error) {
      console.log(error);
      resolve(0);
    }
  });
};
export const syncData = (blob: Blob, books: BookModel[] = [], isSync: true) => {
  return new Promise<boolean>((resolve, reject) => {
    let file = new File([blob], "config.zip", {
      lastModified: new Date().getTime(),
      type: blob.type,
    });
    const fs = window.require("fs");
    const path = window.require("path");
    const AdmZip = window.require("adm-zip");
    const dataPath = localStorage.getItem("storageLocation")
      ? localStorage.getItem("storageLocation")
      : window
          .require("electron")
          .ipcRenderer.sendSync("storage-location", "ping");
    var reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async (event) => {
      if (!event.target) return;
      if (!fs.existsSync(path.join(dataPath))) {
        fs.mkdirSync(path.join(dataPath));
      }
      fs.writeFileSync(
        path.join(dataPath, file.name),
        Buffer.from(event.target.result as any)
      );
      var zip = new AdmZip(path.join(dataPath, file.name));
      zip.extractAllTo(/*target path*/ dataPath, /*overwrite*/ true);

      if (!isSync) {
        let deleteBooks = books.map((item) => {
          return window.localforage.removeItem(item.key);
        });
        await Promise.all(deleteBooks);
        resolve(true);
      } else {
        resolve(true);
      }
    };
  });
};

export const zipBook = (zip: any, books: BookModel[]) => {
  return new Promise<boolean>(async (resolve, reject) => {
    let bookZip = zip.folder("book");
    let data: any = [];
    books &&
      books.forEach((item) => {
        data.push(
          !isElectron
            ? window.localforage.getItem(item.key)
            : BookUtil.fetchBook(item.key, false, item.path)
        );
      });
    try {
      let results = await Promise.all(data);
      for (let i = 0; i < books.length; i++) {
        results[i] && bookZip.file(`${books[i].key}`, results[i]);
      }
      resolve(true);
    } catch (error) {
      resolve(false);
    }
  });
};

export const unzipConfig = (zipEntries: any) => {
  return new Promise<boolean>((resolve, reject) => {
    zipEntries.forEach(function (zipEntry) {
      let text = zipEntry.getData().toString("utf8");
      if (configArr.indexOf(zipEntry.name) > -1 && text) {
        if (
          zipEntry.name === "notes.json" ||
          zipEntry.name === "books.json" ||
          zipEntry.name === "bookmarks.json"
        ) {
          window.localforage.setItem(
            zipEntry.name.split(".")[0],
            JSON.parse(text)
          );
        } else if (zipEntry.name === "pdfjs.history.json") {
          localStorage.setItem("pdfjs.history", text);
        } else {
          localStorage.setItem(zipEntry.name.split(".")[0], text);
        }
      }
    });
    resolve(true);
  });
};

const toArrayBuffer = (buf) => {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
};
export const unzipBook = (zipEntries: any) => {
  return new Promise<boolean>((resolve, reject) => {
    window.localforage.getItem("books").then((value: any) => {
      let count = 0;
      value &&
        value.length > 0 &&
        value.forEach((item: any) => {
          zipEntries.forEach(async (zipEntry) => {
            if (zipEntry.name === item.key) {
              await BookUtil.addBook(
                item.key,
                toArrayBuffer(zipEntry.getData())
              );
              count++;
              if (count === value.length) {
                resolve(true);
              }
            }
          });
        });
    });
  });
};
export const zipConfig = (
  zip: any,
  books: BookModel[],
  notes: NoteModel[],
  bookmarks: BookmarkModel[]
) => {
  return new Promise<boolean>((resolve, reject) => {
    try {
      let configZip = zip.folder("config");
      configZip
        .file("notes.json", JSON.stringify(notes))
        .file("books.json", JSON.stringify(books))
        .file("bookmarks.json", JSON.stringify(bookmarks))
        .file("readerConfig.json", localStorage.getItem("readerConfig") || "")
        .file("themeColors.json", localStorage.getItem("themeColors") || "")
        .file(
          "bookSortCode.json",
          localStorage.getItem("bookSortCode") ||
            JSON.stringify({ sort: 1, order: 2 })
        )
        .file(
          "noteSortCode.json",
          localStorage.getItem("noteSortCode") ||
            JSON.stringify({ sort: 2, order: 2 })
        )
        .file("readingTime.json", localStorage.getItem("readingTime") || "")
        .file("recentBooks.json", localStorage.getItem("recentBooks") || [])
        .file("deletedBooks.json", localStorage.getItem("deletedBooks") || [])
        .file("favoriteBooks.json", localStorage.getItem("favoriteBooks") || [])
        .file("shelfList.json", localStorage.getItem("shelfList") || [])
        .file("noteTags.json", localStorage.getItem("noteTags") || [])
        .file("pdfjs.history.json", localStorage.getItem("pdfjs.history") || [])
        .file(
          "recordLocation.json",
          localStorage.getItem("recordLocation") || ""
        );
      resolve(true);
    } catch (error) {
      resolve(false);
    }
  });
};
export const zipFilesToBlob = (buffers: ArrayBuffer[], names: string[]) => {
  var zip = new window.JSZip();
  for (let index = 0; index < buffers.length; index++) {
    zip.file(names[index], buffers[index]);
  }
  return zip.generateAsync({ type: "blob" });
};
