import { generateSyncRecord, getStorageLocation } from "../common";
import CoverUtil from "./coverUtil";
import {
  CommonTool,
  ConfigService,
} from "../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../storage/databaseService";
import localforage from "localforage";
import Book from "../../models/Book";
import Note from "../../models/Note";
import Bookmark from "../../models/Bookmark";
import DictHistory from "../../models/DictHistory";
import { decryptToken } from "../request/thirdparty";
import toast from "react-hot-toast";
import i18n from "../../i18n";
declare var window: any;
let configCache: any = {};
export const changePath = async (newPath: string) => {
  if (isFolderContainsFile(newPath)) {
    toast.error(i18n.t("Please select an empty folder"));
    return false;
  }
  let oldPath = getStorageLocation() || "";
  const fs = window.require("fs-extra");
  let databaseList = CommonTool.databaseList;

  for (let i = 0; i < databaseList.length; i++) {
    await window.require("electron").ipcRenderer.invoke("close-database", {
      dbName: databaseList[i],
      storagePath: getStorageLocation(),
    });
  }

  try {
    await fs.copy(oldPath, newPath);
    fs.emptyDirSync(oldPath);
    return true;
  } catch (err) {
    console.error(`Error copying folder: ${err}`);
    return false;
  }
};
export const changeLibrary = async (newPath: string) => {
  if (!isKoodoLibrary(newPath)) {
    toast.error(i18n.t("Please select a valid library"));
    return false;
  }
  let databaseList = CommonTool.databaseList;

  for (let i = 0; i < databaseList.length; i++) {
    await window.require("electron").ipcRenderer.invoke("close-database", {
      dbName: databaseList[i],
      storagePath: getStorageLocation(),
    });
  }
  return true;
};
const isFolderContainsFile = (folderPath: string) => {
  const fs = window.require("fs");
  if (!fs.existsSync(folderPath)) {
    return false;
  }
  const files = fs.readdirSync(folderPath);
  return files.length > 0;
};
const isKoodoLibrary = (folderPath: string) => {
  const fs = window.require("fs");
  if (!fs.existsSync(folderPath)) {
    return false;
  }
  const files = fs.readdirSync(folderPath);
  return (
    files.includes("config") &&
    files.includes("book") &&
    files.includes("cover")
  );
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

  const readerConfig = JSON.parse(JSON.parse(data).readerConfig || "{}");
  return parseInt(readerConfig.lastSyncTime || "0");
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
export function getLoginParamsFromUrl() {
  const url = document.location.href;
  const params = {};
  const queryString = url.split("?")[1];
  const regex = /([^&;=]+)=?([^&;]*)/g;
  let match;

  while ((match = regex.exec(queryString))) {
    params[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
  }

  return params;
}
export const upgradeStorage = async (
  handleFinish: () => void = () => {}
): Promise<Boolean> => {
  try {
    let dataPath = getStorageLocation() || "";
    // ConfigService.setItem("isUpgraded", "yes");
    //check if folder named cover exsits
    const fs = window.require("fs");
    const path = window.require("path");
    // upgrage cover and book
    if (ConfigService.getItem("isUpgradedStorage") === "yes") {
      console.info("upgraded");
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
      ConfigService.getItem("pluginList") !== "{}" &&
      ConfigService.getItem("pluginList")
        ? JSON.parse(ConfigService.getItem("pluginList") || "")
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

    ConfigService.setItem("isUpgradedStorage", "yes");
    handleFinish();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
export const upgradeConfig = (): Boolean => {
  try {
    if (ConfigService.getItem("isUpgradedConfig") === "yes") {
      console.info("upgraded");
      return true;
    }
    //upgrade shelf

    let shelfList = ConfigService.getAllMapConfig("shelfList");
    if ("New" in shelfList) {
      ConfigService.deleteMapConfig("New", "shelfList");
    }
    let sortedShelfList =
      ConfigService.getAllListConfig("sortedShelfList") || [];
    if (sortedShelfList.length === 0) {
      ConfigService.setAllListConfig(
        Object.keys(shelfList).filter((item) => item !== "New"),
        "sortedShelfList"
      );
    }

    //upgrade noteSortCode
    let json = ConfigService.getItem("noteSortCode");
    if (json) {
      ConfigService.setReaderConfig("noteSortCode", json);
    }

    //upgrade bookSortCode
    json = ConfigService.getItem("bookSortCode");
    if (json) {
      ConfigService.setReaderConfig("bookSortCode", json);
    }

    //remove dropbox token
    ConfigService.setReaderConfig("dropbox_token", "");

    ConfigService.setItem("isUpgradedConfig", "yes");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
export const upgradePro = async () => {
  await generateSyncRecord();
};
export const getCloudConfig = async (service: string) => {
  if (configCache[service]) {
    return configCache[service];
  } else {
    let result = await decryptToken(service);
    if (result.code !== 200) {
      return {};
    }
    let config = JSON.parse(result.data.token);
    configCache[service] = config;
    return config;
  }
};
export const removeCloudConfig = (service: string) => {
  delete configCache[service];
};
