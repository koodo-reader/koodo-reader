import { getStorageLocation } from "../common";
import { getCloudConfig, upgradeConfig, upgradeStorage } from "./common";
import localforage from "localforage";
import SqlUtil from "./sqlUtil";
import DatabaseService from "../storage/databaseService";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
declare var window: any;
let oldConfigArr = [
  "notes.json",
  "books.json",
  "bookmarks.json",
  "readerConfig.json",
  "noteTags.json",
  "themeColors.json",
  "bookSortCode.json",
  "noteSortCode.json",
  "readingTime.json",
  "recentBooks.json",
  "pluginList.json",
  "favoriteBooks.json",
  "favoriteBooks.json",
  "shelfList.json",
  "pdfjs.history.json",
  "recordLocation.json",
];
export const restore = async (service: string): Promise<Boolean> => {
  const { ipcRenderer } = window.require("electron");
  if (service === "local") {
    let filePath = await ipcRenderer.invoke("select-file", "ping");
    if (!filePath) return false;

    return await restoreFromfilePath(filePath);
  } else {
    let tokenConfig = await getCloudConfig(service);
    await ipcRenderer.invoke("cloud-download", {
      ...tokenConfig,
      fileName: "data.zip",
      service: service,
      type: "backup",
      storagePath: getStorageLocation(),
    });
    const path = window.require("path");
    let filePath = path.join(getStorageLocation(), "backup", "data.zip");
    return await restoreFromfilePath(filePath);
  }
};
export const restoreFromConfigJson = () => {
  const fs = window.require("fs");
  const path = window.require("path");
  const dataPath = getStorageLocation() || "";
  if (!fs.existsSync(path.join(dataPath, "config", "config.json"))) {
    return false;
  }
  let configStr = fs.readFileSync(
    path.join(dataPath, "config", "config.json"),
    "utf-8"
  );
  let config = JSON.parse(configStr);
  for (let key in config) {
    ConfigService.setItem(key, config[key]);
  }
  return true;
};
export const restoreFromfilePath = async (filePath: string) => {
  const fs = window.require("fs");
  const AdmZip = window.require("adm-zip");
  if (!fs.existsSync(filePath)) {
    return false;
  }
  var zip = new AdmZip(filePath);
  var zipEntries = zip.getEntries(); // an array of ZipEntry records
  if (
    zipEntries
      .map((item: any) => item.entryName)
      .indexOf("config/config.json") === -1
  ) {
    return await restoreFromOldBackup(zipEntries);
  } else {
    return await restoreFromNewBackup(zipEntries);
  }
};
export const restoreFromOldBackup = async (zipEntries: any) => {
  let result = await unzipOldConfig(zipEntries);
  if (result) {
    let res = await unzipOldBook(zipEntries);
    if (res) {
      let res1 = await upgradeStorage();
      let res2 = upgradeConfig();
      if (res1 && res2) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
};
export const restoreFromNewBackup = async (zipEntries: any) => {
  let result = await unzipConfig(zipEntries);
  if (result) {
    let res1 = await unzipBook(zipEntries);
    let res2 = await unzipCover(zipEntries);
    if (res1 || res2) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};
export const unzipConfig = async (zipEntries: any) => {
  const fs = window.require("fs");
  const path = window.require("path");
  const dataPath = getStorageLocation() || "";
  if (!fs.existsSync(path.join(dataPath, "config"))) {
    fs.mkdirSync(path.join(dataPath, "config"), { recursive: true });
  }
  // no longer support backup from older version
  if (
    zipEntries
      .map((item: any) => item.entryName)
      .indexOf("config/config.json") === -1
  ) {
    return false;
  }
  let flag = true;
  for (let i = 0; i < zipEntries.length; i++) {
    if (
      zipEntries[i].entryName.startsWith("config/") &&
      !zipEntries[i].isDirectory
    ) {
      if (zipEntries[i].name === "config.json") {
        let text = zipEntries[i].getData().toString("utf8");
        if (!text) {
          flag = false;
          break;
        }
        let config = JSON.parse(text);
        for (let key in config) {
          ConfigService.setItem(key, config[key]);
        }
      } else {
        let buffer = zipEntries[i].getData();
        if (!buffer) {
          flag = false;
          break;
        }
        let dbName = zipEntries[i].name.split(".")[0];
        // await window.require("electron").ipcRenderer.invoke("close-database", {
        //   dbName: dbName,
        //   storagePath: getStorageLocation(),
        // });
        let arraybuffer = new Uint8Array(buffer).buffer;
        let sqlUtil = new SqlUtil();
        let cloudRecords = await sqlUtil.dbBufferToJson(arraybuffer, dbName);
        await DatabaseService.saveAllRecords(cloudRecords, dbName);

        // fs.writeFileSync(
        //   path.join(dataPath, "config", zipEntries[i].name),
        //   buffer
        // );
      }
    }
  }
  return flag;
};

export const unzipBook = async (zipEntries: any) => {
  const fs = window.require("fs");
  const path = window.require("path");
  const dataPath = getStorageLocation() || "";

  if (!fs.existsSync(path.join(dataPath, "book"))) {
    fs.mkdirSync(path.join(dataPath, "book"), { recursive: true });
  }
  let flag = true;
  for (let i = 0; i < zipEntries.length; i++) {
    if (
      zipEntries[i].entryName.startsWith("book/") &&
      !zipEntries[i].isDirectory
    ) {
      let buffer = zipEntries[i].getData();
      if (!buffer) {
        flag = false;
        break;
      }
      fs.writeFileSync(path.join(dataPath, "book", zipEntries[i].name), buffer);
    }
  }
  return flag;
};
export const unzipCover = async (zipEntries: any) => {
  const fs = window.require("fs");
  const path = window.require("path");
  const dataPath = getStorageLocation() || "";

  if (!fs.existsSync(path.join(dataPath, "cover"))) {
    fs.mkdirSync(path.join(dataPath, "cover"), { recursive: true });
  }
  let flag = true;
  for (let i = 0; i < zipEntries.length; i++) {
    if (
      zipEntries[i].entryName.startsWith("cover/") &&
      !zipEntries[i].isDirectory
    ) {
      let buffer = zipEntries[i].getData();
      if (!buffer) {
        flag = false;
        break;
      }
      fs.writeFileSync(
        path.join(dataPath, "cover", zipEntries[i].name),
        buffer
      );
    }
  }
  return flag;
};

export const unzipOldConfig = (zipEntries: any) => {
  return new Promise<boolean>((resolve) => {
    zipEntries.forEach(function (zipEntry) {
      let text = zipEntry.getData().toString("utf8");
      if (oldConfigArr.indexOf(zipEntry.name) > -1 && text) {
        if (
          zipEntry.name === "notes.json" ||
          zipEntry.name === "books.json" ||
          zipEntry.name === "bookmarks.json"
        ) {
          localforage.setItem(zipEntry.name.split(".")[0], JSON.parse(text));
        } else if (zipEntry.name === "pdfjs.history.json") {
          ConfigService.setItem("pdfjs.history", text);
        } else {
          ConfigService.setItem(zipEntry.name.split(".")[0], text);
        }
      }
    });
    ConfigService.setItem("isUpgradedStorage", "no");
    ConfigService.setItem("isUpgradedConfig", "no");
    resolve(true);
  });
};
export const unzipOldBook = (zipEntries: any) => {
  return new Promise<boolean>((resolve) => {
    localforage.getItem("books").then((value: any) => {
      let count = 0;
      const fs = window.require("fs");
      const path = window.require("path");
      const dataPath = getStorageLocation() || "";
      value &&
        value.length > 0 &&
        value.forEach((item: any) => {
          zipEntries.forEach(async (zipEntry) => {
            if (zipEntry.name === item.key) {
              let buffer = zipEntry.getData();

              fs.writeFileSync(
                path.join(
                  dataPath,
                  "book",
                  item.key + "." + item.format.toLowerCase()
                ),
                buffer
              );
              count++;
              if (count === value.length) {
                resolve(true);
              }
            }
          });
        });
    });
  });
};
