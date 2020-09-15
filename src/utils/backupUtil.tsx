// import localforage from "localforage";
import JSZip from "jszip";
import FileSaver from "file-saver";
import BookModel from "../model/Book";
import NoteModel from "../model/Note";
import DigestModel from "../model/Digest";
import HighligherModel from "../model/Highlighter";
import BookmarkModel from "../model/Bookmark";
import DropboxUtil from "./syncUtils/dropbox";

class BackupUtil {
  static backup(
    books: BookModel[],
    notes: NoteModel[],
    digests: DigestModel[],
    highlighters: HighligherModel[],
    bookmarks: BookmarkModel[],
    handleFinish: () => void,
    driveIndex: number,
    showMessage: (message: string) => void
  ) {
    let zip = new JSZip();

    let epubZip = zip.folder("epub");
    books &&
      books.forEach((item) => {
        epubZip.file(`${item.name}.epub`, item.content);
      });
    books &&
      books.forEach((item) => {
        delete item.content;
      });
    let dataZip = zip.folder("data");
    dataZip
      .file("notes.json", JSON.stringify(notes))
      .file("books.json", JSON.stringify(books))
      .file("digests.json", JSON.stringify(digests))
      .file("highlighters.json", JSON.stringify(highlighters))
      .file("bookmarks.json", JSON.stringify(bookmarks))
      .file("readerConfig.json", localStorage.getItem("readerConfig") || "")
      .file(
        "sortCode.json",
        localStorage.getItem("sortCode") || "{ sort: 2, order: 2 }"
      )
      .file("readingTime.json", localStorage.getItem("readingTime") || "")
      .file("recentBooks.json", localStorage.getItem("recentBooks") || [])
      .file("shelfList.json", localStorage.getItem("shelfList") || [])
      .file(
        "recordLocation.json",
        localStorage.getItem("recordLocation") || ""
      );

    let year = new Date().getFullYear(),
      month = new Date().getMonth() + 1,
      day = new Date().getDate();

    zip
      .generateAsync({ type: "blob" })
      .then(function (blob) {
        switch (driveIndex) {
          case 0:
            handleFinish();
            FileSaver.saveAs(
              blob,
              `${year}-${month < 9 ? "0" + month : month}-${
                day < 9 ? "0" + day : day
              }.zip`
            );
            break;
          case 1:
            console.log("backuputil 1");
            DropboxUtil.UploadFile(blob, handleFinish, showMessage);
            break;
          case 2:
            console.log("backuputil 2");
            break;
          default:
            break;
        }
      })
      .catch(() => {
        console.log("Error occurs");
      });
  }
}

export default BackupUtil;
