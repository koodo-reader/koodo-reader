import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import BookmarkModel from "../../model/Bookmark";
import localforage from "localforage";
import isElectron from "is-electron";
import axios from "axios";
import { config } from "../../constants/driveList";
import OtherUtil from "../otherUtil";
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

let JSZip = (window as any).JSZip;

class SyncUtil {
  static moveData(
    bookArr: BookModel[],
    notes: NoteModel[],
    bookmarks: BookmarkModel[],
    isMove: boolean
  ) {
    if (
      !isElectron() ||
      (isMove && OtherUtil.getReaderConfig("isMoved") === "yes")
    ) {
      return;
    }
    localforage.getItem(bookArr[0].key).then(async (result: any) => {
      if (result) {
        let zip = new JSZip();
        let books = bookArr;
        let data: any = [];
        books &&
          books.forEach((item) => {
            data.push(localforage.getItem(item.key));
          });
        let results = await Promise.all(data);
        for (let i = 0; i < books.length; i++) {
          if (books[i].description === "pdf") {
            zip.file(`${books[i].name}.pdf`, results[i]);
          } else {
            zip.file(`${books[i].name}.epub`, results[i]);
          }
        }
        let configZip = zip.folder("config");
        configZip
          .file("notes.json", JSON.stringify(notes))
          .file("books.json", JSON.stringify(books))
          .file("bookmarks.json", JSON.stringify(bookmarks))
          .file("readerConfig.json", localStorage.getItem("readerConfig") || "")
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
          .file(
            "favoriteBooks.json",
            localStorage.getItem("favoriteBooks") || []
          )
          .file("shelfList.json", localStorage.getItem("shelfList") || [])
          .file("noteTags.json", localStorage.getItem("noteTags") || [])
          .file(
            "pdfjs.history.json",
            localStorage.getItem("pdfjs.history") || []
          )
          .file(
            "recordLocation.json",
            localStorage.getItem("recordLocation") || ""
          );

        zip
          .generateAsync({ type: "blob" })
          .then(function (blob: any) {
            let file = new File([blob], "moveData.zip", {
              lastModified: new Date().getTime(),
              type: blob.type,
            });
            let formData = new FormData();
            formData.append("file", file);
            formData.append("isMove", isMove ? "yes" : "no");
            formData.append(
              "path",
              OtherUtil.getReaderConfig("storageLocation")
            );
            axios
              .post(`${config.token_url}/move_data`, formData, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
                responseType: "blob",
              })
              .then(function (response: any) {
                console.log(response, "上传成功");
                OtherUtil.setReaderConfig("isMoved", "yes");
              })
              .catch(function (error: any) {
                console.error(error, "上传失败");
              });
          })
          .catch((err: any) => {
            console.log(err);
          });
      }
    });
  }
  static changeLocation(
    oldPath: string,
    newPath: string,
    handleMessage: (message: string) => void,
    handleMessageBox: (isShow: boolean) => void
  ) {
    axios
      .post(`${config.token_url}/change_location`, {
        oldPath,
        newPath,
      })
      .then(function (response: any) {
        console.log(response, "修改成功");
        handleMessage("Change Successfully");
        handleMessageBox(true);
      })
      .catch(function (error: any) {
        console.log(error, "修改失败");
        handleMessage("Change Failed");
        handleMessageBox(true);
      });
  }
}

export default SyncUtil;
