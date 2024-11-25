import BookModel from "../../models/Book";
import PluginModel from "../../models/Plugin";
import BookUtil from "../file/bookUtil";
import NoteModel from "../../models/Note";
import BookmarkModel from "../../models/Bookmark";
import { isElectron } from "react-device-detect";
import DictHistory from "../../models/DictHistory";
import { base64ToArrayBufferAndExtension } from "./common";
import PluginService from "../service/pluginService";
import BookService from "../service/bookService";
import NoteService from "../service/noteService";
import BookmarkService from "../service/bookmarkService";
import WordService from "../service/wordService";
declare var window: any;

const configList = [
  "readerConfig",
  "themeColors",
  "bookSortCode",
  "noteSortCode",
  "readingTime",
  "recentBooks",
  "deletedBooks",
  "favoriteBooks",
  "shelfList",
  "noteTags",
  "recordLocation",
];

export const backup = (isSync: boolean) => {
  return new Promise<Blob | boolean>(async (resolve, reject) => {
    let zip = new window.JSZip();
    let books = await BookService.getAllBooks();
    let notes = await NoteService.getAllNotes();
    let bookmarks = await BookmarkService.getAllBookmarks();
    let words = await WordService.getAllWords();
    let plugins = await PluginService.getAllPlugins();
    if (!isSync) {
      zipCover(zip, books);
      await zipBook(zip, books);
    }
    let result = await zipConfig(zip, books, notes, bookmarks, words, plugins);
    if (!result) resolve(false);

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
      const result = base64ToArrayBufferAndExtension(
        BookUtil.getCover(books[i])
      );
      coverZip.file(`${books[i].key}.${result.extension}`, result.arrayBuffer);
    }
  }
};

export const zipConfig = (
  zip: any,
  books: BookModel[],
  notes: NoteModel[],
  bookmarks: BookmarkModel[],
  words: DictHistory[],
  plugins: PluginModel[]
) => {
  return new Promise<boolean>((resolve, reject) => {
    try {
      let configZip = zip.folder("config");
      configZip
        .file("notes.json", JSON.stringify(notes))
        .file(
          "books.json",
          JSON.stringify(
            books.map((item) => {
              item.cover = "";
              return item;
            })
          )
        )
        .file("bookmarks.json", JSON.stringify(bookmarks))
        .file("words.json", JSON.stringify(words))
        .file("plugins.json", JSON.stringify(plugins))
        .file("config.json", JSON.stringify(getConfigJson()));
      resolve(true);
    } catch (error) {
      resolve(false);
    }
  });
};
export const getConfigJson = () => {
  let config = {};
  for (let i = 0; i < configList.length; i++) {
    let item = configList[i];
    if (localStorage.getItem(item)) {
      config[item] = localStorage.getItem(item);
    }
  }
  return config;
};
