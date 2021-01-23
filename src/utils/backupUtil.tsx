import FileSaver from "file-saver";
import BookModel from "../model/Book";
import NoteModel from "../model/Note";
import BookmarkModel from "../model/Bookmark";
import DropboxUtil from "./syncUtils/dropbox";
import WebdavUtil from "./syncUtils/webdav";
import localforage from "localforage";

let JSZip = (window as any).JSZip;
class BackupUtil {
  static backup = async (
    bookArr: BookModel[],
    notes: NoteModel[],
    bookmarks: BookmarkModel[],
    handleFinish: () => void,
    driveIndex: number,
    showMessage: (message: string) => void
  ) => {
    let zip = new JSZip();
    let books = bookArr;
    let bookZip = zip.folder("book");
    let data: any = [];
    books &&
      books.forEach((item) => {
        data.push(localforage.getItem(item.key));
        // let result = localforage.getItem(item.key);
        // console.log(result);
        // results.forEach((item) => {
        //   epubZip.file(`${item.name}.epub`, item.content);
        // });
        // epubZip.file(`${item.name}.epub`, result);
      });
    let results = await Promise.all(data);
    for (let i = 0; i < books.length; i++) {
      if (books[i].description === "pdf") {
        bookZip.file(`${books[i].name}.pdf`, results[i]);
      } else {
        bookZip.file(`${books[i].name}.epub`, results[i]);
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
      .file("favoriteBooks.json", localStorage.getItem("favoriteBooks") || [])
      .file("shelfList.json", localStorage.getItem("shelfList") || [])
      .file("noteTags.json", localStorage.getItem("noteTags") || [])
      .file("pdfjs.history.json", localStorage.getItem("pdfjs.history") || [])
      .file(
        "recordLocation.json",
        localStorage.getItem("recordLocation") || ""
      );

    let year = new Date().getFullYear(),
      month = new Date().getMonth() + 1,
      day = new Date().getDate();

    zip
      .generateAsync({ type: "blob" })
      .then(function (blob: any) {
        switch (driveIndex) {
          case 0:
            handleFinish();
            FileSaver.saveAs(
              blob,
              `${year}-${month <= 9 ? "0" + month : month}-${
                day <= 9 ? "0" + day : day
              }.zip`
            );
            break;
          case 1:
            DropboxUtil.UploadFile(blob, handleFinish, showMessage);
            break;
          case 2:
            break;
          case 3:
            WebdavUtil.UploadFile(
              new File([blob], "data.zip", {
                lastModified: new Date().getTime(),
                type: blob.type,
              }),
              handleFinish,
              showMessage
            );
            break;
          default:
            break;
        }
      })
      .catch((err: any) => {
        console.log(err);
      });
  };
}

export default BackupUtil;
