import BookModel from "../../models/Book";
import PluginModel from "../../models/Plugin";
import BookUtil from "./bookUtil";
import NoteModel from "../../models/Note";
import BookmarkModel from "../../models/Bookmark";
import { isElectron } from "react-device-detect";
import DictHistory from "../../models/DictHistory";
import PluginService from "../service/pluginService";
import BookService from "../service/bookService";
import NoteService from "../service/noteService";
import BookmarkService from "../service/bookmarkService";
import WordService from "../service/wordService";
import { getStorageLocation } from "../common";
import CoverUtil from "./coverUtil";
import ConfigService from "../service/configService";
declare var window: any;

export const backupFromPath = () => {
  const path = window.require("path");
  const AdmZip = window.require("adm-zip");
  const dataPath = getStorageLocation() || "";
  let zip = new AdmZip();
  backupToConfigJson();
  zip.addLocalFolder(path.join(dataPath, "book"), "book");
  zip.addLocalFolder(path.join(dataPath, "cover"), "cover");
  zip.addLocalFolder(path.join(dataPath, "config"), "config");
  return zip.toBuffer();
};
export const backupFromStorage = async () => {
  let zip = new window.JSZip();
  let books = await BookService.getDbBuffer();
  let notes = await NoteService.getDbBuffer();
  let bookmarks = await BookmarkService.getDbBuffer();
  let words = await WordService.getDbBuffer();
  let plugins = await PluginService.getDbBuffer();
  let config = JSON.stringify(ConfigService.getConfigJson());
  zipCover(zip, books);
  await zipBook(zip, books);
  let result = await zipConfig(
    zip,
    books,
    notes,
    bookmarks,
    words,
    plugins,
    config
  );
  if (!result) return false;
  return zip.generateAsync({ type: "blob" });
};

export const backupToConfigJson = () => {
  let configStr = JSON.stringify(ConfigService.getConfigJson());
  let blob = new Blob([configStr], { type: "application/json" });
  const fs = window.require("fs");
  const path = window.require("path");
  const dataPath = getStorageLocation() || "";
  if (!fs.existsSync(path.join(dataPath))) {
    fs.mkdirSync(path.join(dataPath));
  }
  fs.writeFileSync(path.join(dataPath, "config.json"), blob);
};
export const zipBook = (zip: any, books: BookModel[]) => {
  return new Promise<boolean>(async (resolve, reject) => {
    let bookZip = zip.folder("book");
    let data: any = [];
    books &&
      books.forEach((item) => {
        data.push(
          BookUtil.fetchBook(
            item.key,
            item.format.toLowerCase(),
            false,
            item.path
          )
        );
      });
    try {
      let results = await Promise.all(data);
      for (let i = 0; i < books.length; i++) {
        results[i] &&
          bookZip.file(
            `${books[i].key}.${books[i].format.toLocaleLowerCase()}`,
            results[i]
          );
      }
      resolve(true);
    } catch (error) {
      resolve(false);
    }
  });
};
export const zipCover = (zip: any, books: BookModel[]) => {
  let coverZip = zip.folder("cover");
  if (isElectron) {
  } else {
    for (let i = 0; i < books.length; i++) {
      const result = CoverUtil.convertCoverBase64(CoverUtil.getCover(books[i]));
      coverZip.file(`${books[i].key}.${result.extension}`, result.arrayBuffer);
    }
  }
};

export const zipConfig = (
  zip: any,
  bookBuffer: ArrayBuffer,
  noteBuffer: ArrayBuffer,
  bookmarkBuffer: ArrayBuffer,
  wordBuffer: ArrayBuffer,
  pluginBuffer: ArrayBuffer,
  config: string
) => {
  return new Promise<boolean>((resolve, reject) => {
    try {
      let configZip = zip.folder("config");
      configZip
        .file("notes.db", noteBuffer)
        .file("books.db", bookBuffer)
        .file("bookmarks.db", bookmarkBuffer)
        .file("words.db", wordBuffer)
        .file("plugins.db", pluginBuffer)
        .file("config.json", config);
      resolve(true);
    } catch (error) {
      resolve(false);
    }
  });
};
