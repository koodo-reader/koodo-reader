import BookModel from "../../models/Book";
import NoteModel from "../../models/Note";
import BookmarkModel from "../../models/Bookmark";
import { zipBook, zipConfig } from "./common";
declare var window: any;

export const backup = (
  bookArr: BookModel[],
  notes: NoteModel[],
  bookmarks: BookmarkModel[],
  isSync: boolean
) => {
  return new Promise<Blob | boolean>(async (resolve, reject) => {
    let zip = new window.JSZip();
    let books = bookArr;
    let result = await zipConfig(zip, books, notes, bookmarks);
    if (!result) resolve(false);
    if (!isSync) {
      await zipBook(zip, books);
    }
    zip
      .generateAsync({ type: "blob" })
      .then((blob: any) => {
        resolve(blob);
      })
      .catch((err: any) => {
        console.log(err);
        resolve(false);
      });
  });
};
