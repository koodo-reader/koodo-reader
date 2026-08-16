import BookUtil from "./bookUtil";
import { isElectron } from "react-device-detect";
import { checkMissingBook, getStorageLocation } from "../common";
import CoverUtil from "./coverUtil";
import {
  CommonTool,
  ConfigService,
} from "../../assets/lib/kookit-extra-browser.min";
import { getCloudConfig } from "./common";
import DatabaseService from "../storage/databaseService";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import ConfigUtil from "./configUtil";
import SyncService from "../storage/syncService";
import BackgroundUtil from "./backgroundUtil";
import FontUtil from "./fontUtil";
import toast from "react-hot-toast";
import i18n from "../../i18n";

declare var window: any;

export const backup = async (service: string): Promise<Boolean> => {
  await checkMissingBook();
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
    const ipcRenderer = window.electronAPI;
    let targetPath = "";
    if (service === "local") {
      const backupPath = await ipcRenderer.invoke("select-path");
      if (!backupPath) {
        toast.error(i18n.t("Please select a backup path"));
        return false;
      }
      targetPath = backupPath;
    } else {
      const path = window.electronAPI.path;
      targetPath = path.join(getStorageLocation(), "backup");
    }
    toast.loading(i18n.t("Backup...") + " (0%)", {
      id: "backup",
    });
    // 让 UI 有时间渲染 toast
    await new Promise((resolve) => setTimeout(resolve, 100));
    const backupResult = await backupFromPath(
      targetPath,
      fileName,
      (percent) => {
        toast.loading(i18n.t("Backup...") + ` (${percent}%)`, {
          id: "backup",
        });
      }
    );
    if (!backupResult) {
      return false;
    }
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
    const path = window.electronAPI.path;
    const fs = window.electronAPI.fs;
    const zip = new JSZip();
    const dataPath = getStorageLocation() || "";
    const snapshotPath = path.join(dataPath, "snapshot");
    const fileName = `${new Date().getTime()}.zip`;
    const databaseList = CommonTool.databaseList;
    for (let i = 0; i < databaseList.length; i++) {
      await window.electronAPI.invoke("close-database", {
        dbName: databaseList[i],
        storagePath: getStorageLocation(),
      });
      const databasePath = path.join(dataPath, "config", databaseList[i] + ".db");
      if (fs.existsSync(databasePath)) {
        zip.file(path.posix.join("config", databaseList[i] + ".db"), fs.readFileSync(databasePath));
      }
    }
    const configStr = JSON.stringify(await ConfigUtil.dumpConfig("config"));
    zip.file("config/config.json", configStr);
    if (!fs.existsSync(snapshotPath)) fs.mkdirSync(snapshotPath, { recursive: true });
    const output = await zip.generateAsync({ type: "uint8array" });
    fs.writeFileSync(path.join(snapshotPath, fileName), output);
    const snapshots = getSnapshots();
    for (let i = 30; i < snapshots.length; i++) {
      fs.unlinkSync(path.join(snapshotPath, snapshots[i].file));
    }
  } catch (error) {
    console.error("Failed to generate snapshot:", error);
    const message = error instanceof Error ? error.message : String(error);
    toast.error(message);
  }
};
export const getSnapshots = () => {
  if (!isElectron) {
    return [];
  }
  const path = window.electronAPI.path;
  const fs = window.electronAPI.fs;
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
export const backupFromPath = async (
  targetPath: string,
  fileName: string,
  onProgress?: (percent: number) => void
) => {
  const path = window.electronAPI.path;
  const dataPath = getStorageLocation() || "";
  const fs = window.electronAPI.fs;
  const ipcRenderer = window.electronAPI;

  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  await backupToConfigJson();

  let databaseList = CommonTool.databaseList;
  for (let i = 0; i < databaseList.length; i++) {
    await ipcRenderer.invoke("close-database", {
      dbName: databaseList[i],
      storagePath: getStorageLocation(),
    });
  }

  // 由主进程用 yazl 流式打包，避免在渲染进程把整个图书库读入内存。
  // 目录按 ZIP 内层级逐层加入，config 目录下的 *.db / config.json / sync.json
  // 通过 configFiles 单独传入 —— 主进程只读取 backupPath 参数指定的源，
  // 渲染进程不再向主进程透传任意文件内容。
  const dirs: string[] = [];
  for (const dir of ["book", "cover", "dict", "background", "snapshot"]) {
    if (fs.existsSync(path.join(dataPath, dir))) {
      dirs.push(dir);
    }
  }

  // config 目录下需要入包的相对路径（*.db / config.json / sync.json）
  const configFiles: string[] = [];
  for (const configFile of ["config.json", "sync.json"]) {
    const sourcePath = path.join(dataPath, "config", configFile);
    if (fs.existsSync(sourcePath)) {
      configFiles.push(path.posix.join("config", configFile));
    }
  }
  for (const dbName of databaseList) {
    if (fs.existsSync(path.join(dataPath, "config", `${dbName}.db`))) {
      configFiles.push(path.posix.join("config", `${dbName}.db`));
    }
  }

  const progressListener = (payload: { percent: number }) => {
    onProgress && onProgress(payload.percent);
  };
  ipcRenderer.on("backup-progress", progressListener);
  try {
    const result = await ipcRenderer.invoke("backup-path", {
      targetPath,
      fileName,
      dataPath,
      dirs,
      files: configFiles,
    });
    if (!result || result.ok !== true) {
      const message = (result && result.error) || "Backup failed";
      toast.error(message, { id: "backup" });
      return false;
    }
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    toast.error(errorMessage, { id: "backup" });
    return false;
  } finally {
    ipcRenderer.removeListener("backup-progress", progressListener);
  }
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
  await zipBackground(zip);
  await zipFont(zip);
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
  const fs = window.electronAPI.fs;
  const path = window.electronAPI.path;
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
  const fs = window.electronAPI.fs;
  const path = window.electronAPI.path;
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
      let cover = await CoverUtil.getCover(books[i]);
      if (!cover) {
        continue;
      }
      const result = await CoverUtil.convertCoverBase64(cover);
      coverZip.file(`${books[i].key}.${result.extension}`, result.arrayBuffer);
    }
  }
};

export const zipBackground = async (zip: any) => {
  const backgroundIds = ConfigService.getAllListConfig("backgroundList") || [];
  const bgZip = zip.folder("background");
  for (const id of backgroundIds) {
    const meta = BackgroundUtil.getImageMeta(id);
    if (!meta) continue;
    try {
      const dataUrl = await BackgroundUtil.loadImage(id, meta.extension);
      if (!dataUrl) continue;
      const { arrayBuffer, extension } = BackgroundUtil.convertDataUrl(dataUrl);
      bgZip.file(`${id}.${extension}`, arrayBuffer);
    } catch (error) {
      console.error(`Failed to backup background ${id}:`, error);
    }
  }
};

export const zipFont = async (zip: any) => {
  const fontIds = ConfigService.getAllListConfig("fontList") || [];
  const fontZip = zip.folder("font");
  for (const id of fontIds) {
    const meta = FontUtil.getFontMeta(id);
    if (!meta) continue;
    try {
      const buffer = await FontUtil.loadFontArrayBuffer(id, meta.type);
      if (!buffer) continue;
      fontZip.file(`${id}.${meta.type}`, buffer);
    } catch (error) {
      console.error(`Failed to backup font ${id}:`, error);
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
