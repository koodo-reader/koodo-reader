import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import BookmarkModel from "../../model/Bookmark";
import { zipBook, zipConfig } from "./common";

let JSZip = (window as any).JSZip;

export const backup = (
  bookArr: BookModel[],
  notes: NoteModel[],
  bookmarks: BookmarkModel[],
  isSync: boolean
) => {
  return new Promise<Blob | boolean>(async (resolve, reject) => {
    let zip = new JSZip();
    let books = bookArr;
    //0表示备份到本地，1表示备份到dropbox,2表示备份到onedrive,3表示备份到webdav，4表示把indexeddb中的数据转移到uploads文件夹中，5表示同步数据到本地
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
