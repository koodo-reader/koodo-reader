import BookModel from "../../model/Book";
import localforage from "localforage";
import BookUtil from "../fileUtils/bookUtil";
import NoteModel from "../../model/Note";
import BookmarkModel from "../../model/Bookmark";
import { isElectron } from "react-device-detect";

let JSZip = (window as any).JSZip;
let configArr = [
  "notes",
  "books",
  "bookmarks",
  "readerConfig",
  "noteTags",
  "themeColors",
  "bookSortCode",
  "noteSortCode",
  "readingTime",
  "recentBooks",
  "favoriteBooks",
  "favoriteBooks",
  "shelfList",
  "pdfjs.history",
  "recordLocation",
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
        return localforage.removeItem(item.key);
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
      fs.writeFileSync(
        path.join(dataPath, file.name),
        Buffer.from(event.target.result as any)
      );
      var zip = new AdmZip(path.join(dataPath, file.name));
      zip.extractAllTo(/*target path*/ dataPath, /*overwrite*/ true);

      if (!isSync) {
        let deleteBooks = books.map((item) => {
          return localforage.removeItem(item.key);
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
            ? localforage.getItem(item.key)
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

export const unzipConfig = (file: File) => {
  return new Promise<boolean>((resolve, reject) => {
    let zip = new JSZip();
    let count = 0;
    configArr.forEach((item) => {
      zip
        .loadAsync(file)
        .then((content: any) => {
          return content.files[
            content.files[`${item}.json`]
              ? `${item}.json`
              : `config/${item}.json`
          ].async("text");
        })
        .then(async (text: any) => {
          if (text) {
            if (item === "notes" || item === "books" || item === "bookmarks") {
              localforage.setItem(item, JSON.parse(text));
            } else {
              localStorage.setItem(item, text);
            }
          }
          count++;
          if (count === configArr.length) {
            resolve(true);
          }
        })
        .catch((err: any) => {
          reject(false);
          console.log(err, "Error happen");
        });
    });
  });
};

export const unzipBook = (file: File) => {
  return new Promise<boolean>((resolve, reject) => {
    localforage.getItem("books").then((value: any) => {
      let zip = new JSZip();
      let count = 0;
      value &&
        value.length > 0 &&
        value.forEach((item: any) => {
          zip
            .loadAsync(file)
            .then((content: any) => {
              if (content.files[`book/${item.key}`]) {
                return content.files[`book/${item.key}`].async("arraybuffer");
              } else if (content.files[`${item.key}`]) {
                return content.files[`${item.key}`].async("arraybuffer");
              }
              if (
                content.files[`book/${item.name}.pdf`] &&
                item.description === "pdf"
              ) {
                //兼容之前的版本
                return content.files[`book/${item.name}.pdf`].async(
                  "arraybuffer"
                ); // a promise of "Hello World\n"
              } else if (content.files[`book/${item.name}.epub`]) {
                return content.files[`book/${item.name}.epub`].async(
                  "arraybuffer"
                ); // a promise of "Hello World\n"
              }
            })
            .then(async (book: any) => {
              await BookUtil.addBook(item.key, book);
              count++;
              if (count === value.length) {
                resolve(true);
              }
            })
            .catch((err: any) => {
              resolve(false);
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
            JSON.stringify({ sort: 0, order: 2 })
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
