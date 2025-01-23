import { getStorageLocation } from "../common";
import CoverUtil from "./coverUtil";
import ConfigService from "../storage/configService";
import DatabaseService from "../storage/databaseService";
import localforage from "localforage";
import Book from "../../models/Book";
import Note from "../../models/Note";
import Bookmark from "../../models/Bookmark";
import DictHistory from "../../models/DictHistory";
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
    q = window.location.search.substring(1).split("#")[0];
  while ((e = r.exec(q))) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

export const upgradeStorage = async (
  handleFinish: () => void = () => {}
): Promise<Boolean> => {
  try {
    let dataPath = getStorageLocation() || "";
    // localStorage.setItem("isUpgraded", "yes");
    //check if folder named cover exsits
    const fs = window.require("fs");
    const path = window.require("path");
    // upgrage cover and book
    if (localStorage.getItem("isUpgradedStorage") === "yes") {
      console.log("upgraded");
      return true;
    }

    fs.mkdirSync(path.join(dataPath, "cover"), { recursive: true });
    let books: Book[] | null = await localforage.getItem("books");
    if (books && books.length > 0) {
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
      await DatabaseService.saveAllRecords(books, "books");
    }

    //uprade book files
    if (fs.existsSync(path.join(dataPath, "book")) && books) {
      const files = fs.readdirSync(path.join(dataPath, "book"));
      if (files.length > 0) {
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
      }
    }

    //upgrade plugin
    let plugins =
      localStorage.getItem("pluginList") !== "{}" &&
      localStorage.getItem("pluginList")
        ? JSON.parse(localStorage.getItem("pluginList") || "")
        : [];
    if (plugins.length > 0) {
      plugins = plugins.map((item: any) => {
        if (!item.key) {
          item.key = item.identifier;
        }
        return item;
      });
      await DatabaseService.saveAllRecords(plugins, "plugins");
    }

    //upgrade notes
    let notes: Note[] | null = await localforage.getItem("notes");
    if (notes && notes.length > 0) {
      await DatabaseService.saveAllRecords(notes, "notes");
    }

    //upgrade bookmarks
    let bookmarks: Bookmark[] | null = await localforage.getItem("bookmarks");
    if (bookmarks && bookmarks.length > 0) {
      await DatabaseService.saveAllRecords(bookmarks, "bookmarks");
    }
    //upgrade words
    let words: DictHistory[] | null = await localforage.getItem("words");
    if (words && words.length > 0) {
      await DatabaseService.saveAllRecords(words, "words");
    }

    localStorage.setItem("isUpgradedStorage", "yes");
    handleFinish();
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
export const upgradeConfig = (): Boolean => {
  try {
    if (localStorage.getItem("isUpgradedConfig") === "yes") {
      console.log("upgraded");
      return true;
    }
    //upgrade shelf

    let shelfList = ConfigService.getAllMapConfig("shelfList");
    if ("New" in shelfList) {
      ConfigService.deleteMapConfig("New", "shelfList");
    }

    //upgrade noteSortCode
    let json = localStorage.getItem("noteSortCode");
    if (json) {
      ConfigService.setReaderConfig("noteSortCode", json);
    }

    //upgrade bookSortCode
    json = localStorage.getItem("bookSortCode");
    if (json) {
      ConfigService.setReaderConfig("bookSortCode", json);
    }

    //remove dropbox token
    ConfigService.setReaderConfig("dropbox_token", "");

    localStorage.setItem("isUpgradedConfig", "yes");
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
export const getCloudConfig = (service: string) => {
  let tokenConfig = {};
  try {
    tokenConfig = JSON.parse(ConfigService.getReaderConfig(service + "_token"));
  } catch (e) {
    tokenConfig = {
      refresh_token: ConfigService.getReaderConfig(service + "_token"),
    };
  }
  return tokenConfig;
};
