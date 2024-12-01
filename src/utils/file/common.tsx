import { getStorageLocation } from "../common";
import CoverUtil from "./coverUtil";
import BookmarkService from "../service/bookmarkService";
import BookService from "../service/bookService";
import NoteService from "../service/noteService";
import PluginService from "../service/pluginService";
import WordService from "../service/wordService";
declare var window: any;
export const changePath = async (newPath: string) => {
  if (isFolderContainsFile(newPath)) {
    return false;
  }
  let oldPath = getStorageLocation() || "";
  const fs = window.require("fs-extra");
  await window.require("electron").ipcRenderer.invoke("close-database", {
    dbName: "books",
    storagePath: getStorageLocation(),
  });
  await window.require("electron").ipcRenderer.invoke("close-database", {
    dbName: "notes",
    storagePath: getStorageLocation(),
  });
  await window.require("electron").ipcRenderer.invoke("close-database", {
    dbName: "bookmarks",
    storagePath: getStorageLocation(),
  });
  await window.require("electron").ipcRenderer.invoke("close-database", {
    dbName: "words",
    storagePath: getStorageLocation(),
  });
  await window.require("electron").ipcRenderer.invoke("close-database", {
    dbName: "plugins",
    storagePath: getStorageLocation(),
  });
  try {
    await fs.copy(oldPath, newPath);
    fs.emptyDirSync(oldPath);
    return true;
  } catch (err) {
    console.error(`Error copying folder: ${err}`);
    return false;
  }
};
const isFolderContainsFile = (folderPath: string) => {
  const fs = window.require("fs");
  const files = fs.readdirSync(folderPath);
  return files.length > 0;
};
export const getLastSyncTimeFromConfigJson = () => {
  const fs = window.require("fs");
  const path = window.require("path");
  const dataPath = getStorageLocation() || "";
  if (!fs.existsSync(path.join(dataPath, "config", "config.json"))) {
    return 0;
  }
  let data = fs.readFileSync(
    path.join(dataPath, "config", "config.json"),
    "utf-8"
  );
  const readerConfig = JSON.parse(JSON.parse(data).readerConfig);
  return parseInt(readerConfig.lastSyncTime);
};
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

export const upgradeStorage = async (toast: any) => {
  let dataPath = getStorageLocation() || "";
  // localStorage.setItem("isUpgraded", "yes");
  //check if folder named cover exsits
  const fs = window.require("fs");
  const path = window.require("path");
  // upgrage cover and book
  if (
    localStorage.getItem("isUpgraded") === "yes" ||
    fs.existsSync(path.join(dataPath, "cover"))
  ) {
    console.log("upgraded");
    return;
  }
  toast("Upgrading data");

  fs.mkdirSync(path.join(dataPath, "cover"), { recursive: true });
  let books = await window.localforage.getItem("books");
  books.forEach((item) => {
    let cover = item.cover;
    if (cover) {
      let result = CoverUtil.convertCoverBase64(cover);
      fs.writeFileSync(
        path.join(dataPath, "cover", `${item.key}.${result.extension}`),
        Buffer.from(result.arrayBuffer)
      );
      item.cover = "";
    }
  });
  await BookService.saveAllBooks(books);

  //uprade book files
  if (!fs.existsSync(path.join(dataPath, "book"))) {
    return;
  }
  const files = fs.readdirSync(path.join(dataPath, "book"));
  for (let i = 0; i < files.length; i++) {
    let fileName = files[i];
    let book = books.find((item) => item.key === fileName);
    if (book) {
      let newFileName = `${book.key}.${book.format.toLowerCase()}`;
      fs.renameSync(
        path.join(dataPath, "book", fileName),
        path.join(dataPath, "book", newFileName)
      );
    }
    if (fileName.startsWith("cache")) {
      let newFileName = `${fileName}.zip`;
      fs.renameSync(
        path.join(dataPath, "book", fileName),
        path.join(dataPath, "book", newFileName)
      );
    }
  }
  //upgrade plugin
  let plugins =
    localStorage.getItem("pluginList") !== "{}" &&
    localStorage.getItem("pluginList")
      ? JSON.parse(localStorage.getItem("pluginList") || "")
      : [];
  plugins.length > 0 && (await PluginService.saveAllPlugins(plugins));

  //upgrade notes
  let notes = await window.localforage.getItem("notes");
  if (notes && notes.length > 0) {
    await NoteService.saveAllNotes(notes);
  }

  //upgrade bookmarks
  let bookmarks = await window.localforage.getItem("bookmarks");
  if (bookmarks && bookmarks.length > 0) {
    await BookmarkService.saveAllBookmarks(bookmarks);
  }
  //upgrade words
  let words = await window.localforage.getItem("words");
  if (words && words.length > 0) {
    await WordService.saveAllWords(words);
  }

  toast.success("Upgrade successful");
  localStorage.setItem("isUpgraded", "yes");
};
