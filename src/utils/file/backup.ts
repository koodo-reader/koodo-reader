import BookUtil from "./bookUtil";
import { isElectron } from "react-device-detect";
import { getStorageLocation } from "../common";
import CoverUtil from "./coverUtil";
import { CommonTool } from "../../assets/lib/kookit-extra-browser.min";
import { getCloudConfig } from "./common";
import DatabaseService from "../storage/databaseService";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import ConfigUtil from "./configUtil";
import SyncService from "../storage/syncService";
import toast from "react-hot-toast";
import i18n from "../../i18n";

declare var window: any;

export const backup = async (service: string): Promise<Boolean> => {
  let fileName = "data.zip";
  if (service === "local") {
    let year = new Date().getFullYear(),
      month = new Date().getMonth() + 1,
      day = new Date().getDate();
    fileName = `${year}-${month <= 9 ? "0" + month : month}-${
      day <= 9 ? "0" + day : day
    }.zip`;
  }
  if (isElectron) {
    const { ipcRenderer } = window.require("electron");
    let targetPath = "";
    if (service === "local") {
      const backupPath = await ipcRenderer.invoke("select-path");
      if (!backupPath) {
        toast.error(i18n.t("Please select a backup path"));
        return false;
      }
      targetPath = backupPath;
    } else {
      const path = window.require("path");
      targetPath = path.join(getStorageLocation(), "backup");
    }
    await backupFromPath(targetPath, fileName);
    if (service === "local") {
      return true;
    } else {
      let tokenConfig = await getCloudConfig(service);

      return await ipcRenderer.invoke("cloud-upload", {
        ...tokenConfig,
        fileName: "data.zip",
        service: service,
        type: "backup",
        storagePath: getStorageLocation(),
      });
    }
  } else {
    let blob: Blob | boolean = await backupFromStorage();
    if (!blob) {
      return false;
    }
    if (service === "local") {
      saveAs(blob as Blob, fileName);
      return true;
    } else {
      let syncUtil = await SyncService.getSyncUtil();
      let result = await syncUtil.uploadFile(fileName, "backup", blob as Blob);
      if (result) {
        return true;
      } else {
        return false;
      }
    }
  }
};
export const generateSnapshot = async () => {
  try {
    const path = window.require("path");
    const fs = window.require("fs");
    const AdmZip = window.require("adm-zip");
    let zip = new AdmZip();
    const dataPath = getStorageLocation() || "";
    let snapshotPath = path.join(dataPath, "snapshot");
    let fileName = `${new Date().getTime()}.zip`;
    let databaseList = CommonTool.databaseList;
    for (let i = 0; i < databaseList.length; i++) {
      await window.require("electron").ipcRenderer.invoke("close-database", {
        dbName: databaseList[i],
        storagePath: getStorageLocation(),
      });
      if (
        fs.existsSync(path.join(dataPath, "config", databaseList[i] + ".db"))
      ) {
        zip.addLocalFile(
          path.join(dataPath, "config", databaseList[i] + ".db"),
          "config"
        );
      }
    }
    let configStr = JSON.stringify(await ConfigUtil.dumpConfig("config"));
    zip.addFile("config/config.json", Buffer.from(configStr, "utf-8"));

    if (!fs.existsSync(snapshotPath)) {
      fs.mkdirSync(snapshotPath, { recursive: true });
    }
    await zip.writeZip(path.join(snapshotPath, fileName));
    //delete old snapshots
    let snapshots = getSnapshots();
    if (snapshots.length <= 30) {
      return;
    }
    for (let i = 30; i < snapshots.length; i++) {
      fs.unlinkSync(path.join(snapshotPath, snapshots[i].file));
    }
  } catch (error) {
    // Log error for debugging and avoid unhandled exceptions
    console.error("Failed to generate snapshot:", error);
    // Best-effort user notification; ignore any errors from toast/i18n
    let message = error instanceof Error ? error.message : String(error);
    toast.error(message);
  }
};
export const getSnapshots = () => {
  if (!isElectron) {
    return [];
  }
  const path = window.require("path");
  const fs = window.require("fs");
  const dataPath = getStorageLocation() || "";
  let snapshotPath = path.join(dataPath, "snapshot");
  let snapshots: { file: string; time: number }[] = [];
  if (!fs.existsSync(snapshotPath)) {
    return snapshots;
  }
  let files = fs.readdirSync(snapshotPath);
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    // Only process .zip files with a numeric base name
    if (!fileName.endsWith(".zip")) {
      continue;
    }
    const baseName = fileName.slice(0, -4); // remove ".zip"
    const time = parseInt(baseName, 10);
    if (Number.isNaN(time)) {
      continue;
    }
    snapshots.push({
      file: fileName,
      time: time,
    });
  }
  snapshots.sort((a, b) => b.time - a.time);
  return snapshots;
};
export const backupFromPath = async (targetPath: string, fileName: string) => {
  const path = window.require("path");
  const AdmZip = window.require("adm-zip");
  const dataPath = getStorageLocation() || "";
  let zip = new AdmZip();
  const fs = window.require("fs");
  if (!fs.existsSync(path.join(targetPath))) {
    fs.mkdirSync(path.join(targetPath), { recursive: true });
  }
  await backupToConfigJson();

  if (fs.existsSync(path.join(dataPath, "book"))) {
    zip.addLocalFolder(path.join(dataPath, "book"), "book");
  }
  if (fs.existsSync(path.join(dataPath, "cover"))) {
    zip.addLocalFolder(path.join(dataPath, "cover"), "cover");
  }
  if (fs.existsSync(path.join(dataPath, "config", "config.json"))) {
    zip.addLocalFile(path.join(dataPath, "config", "config.json"), "config");
  }
  if (fs.existsSync(path.join(dataPath, "config", "sync.json"))) {
    zip.addLocalFile(path.join(dataPath, "config", "sync.json"), "config");
  }
  let databaseList = CommonTool.databaseList;
  for (let i = 0; i < databaseList.length; i++) {
    await window.require("electron").ipcRenderer.invoke("close-database", {
      dbName: databaseList[i],
      storagePath: getStorageLocation(),
    });
    if (fs.existsSync(path.join(dataPath, "config", databaseList[i] + ".db"))) {
      zip.addLocalFile(
        path.join(dataPath, "config", databaseList[i] + ".db"),
        "config"
      );
    }
  }

  await zip.writeZip(path.join(targetPath, fileName));

  // return new Blob([zip.toBuffer()], { type: "application/zip" });
};
export const backupFromStorage = async () => {
  let zip = new JSZip();
  let books = await DatabaseService.getDbBuffer("books");
  let notes = await DatabaseService.getDbBuffer("notes");
  let bookmarks = await DatabaseService.getDbBuffer("bookmarks");
  let words = await DatabaseService.getDbBuffer("words");
  let plugins = await DatabaseService.getDbBuffer("plugins");
  let config = JSON.stringify(await ConfigUtil.dumpConfig("config"));
  let sync = JSON.stringify(await ConfigUtil.dumpConfig("sync"));
  await zipCover(zip);
  await zipBook(zip);
  let result = await zipConfig(
    zip,
    books,
    notes,
    bookmarks,
    words,
    plugins,
    config,
    sync
  );
  if (!result) return false;
  return await zip.generateAsync({ type: "blob" });
};

export const backupToConfigJson = async () => {
  let configStr = JSON.stringify(await ConfigUtil.dumpConfig("config"));
  const fs = window.require("fs");
  const path = window.require("path");
  const dataPath = getStorageLocation() || "";
  if (!fs.existsSync(path.join(dataPath, "config"))) {
    fs.mkdirSync(path.join(dataPath, "config"), { recursive: true });
  }
  fs.writeFileSync(
    path.join(dataPath, "config", "config.json"),
    configStr,
    "utf-8"
  );
};
export const backupToSyncJson = async () => {
  let syncStr = JSON.stringify(await ConfigUtil.dumpConfig("sync"));
  const fs = window.require("fs");
  const path = window.require("path");
  const dataPath = getStorageLocation() || "";
  if (!fs.existsSync(path.join(dataPath, "config"))) {
    fs.mkdirSync(path.join(dataPath, "config"), { recursive: true });
  }
  fs.writeFileSync(
    path.join(dataPath, "config", "sync.json"),
    syncStr,
    "utf-8"
  );
};

export const zipBook = (zip: any) => {
  return new Promise<boolean>(async (resolve) => {
    let books = await DatabaseService.getAllRecords("books");
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
      resolve(false);
    }
  });
};
export const zipCover = async (zip: any) => {
  let books = await DatabaseService.getAllRecords("books");
  let coverZip = zip.folder("cover");
  if (isElectron) {
  } else {
    for (let i = 0; i < books.length; i++) {
      const result = CoverUtil.convertCoverBase64(
        await CoverUtil.getCover(books[i])
      );
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
  config: string,
  sync: string
) => {
  return new Promise<boolean>((resolve) => {
    try {
      let configZip = zip.folder("config");
      configZip
        .file("notes.db", noteBuffer)
        .file("books.db", bookBuffer)
        .file("bookmarks.db", bookmarkBuffer)
        .file("words.db", wordBuffer)
        .file("plugins.db", pluginBuffer)
        .file("config.json", config)
        .file("sync.json", sync);
      resolve(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
      resolve(false);
    }
  });
};
