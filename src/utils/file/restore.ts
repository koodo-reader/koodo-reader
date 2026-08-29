import { generateSyncRecord, getStorageLocation } from "../common";
import { getCloudConfig, upgradeConfig, upgradeStorage } from "./common";
import localforage from "localforage";
import SqlUtil from "./sqlUtil";
import DatabaseService from "../storage/databaseService";
import {
  CommonTool,
  ConfigService,
} from "../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import i18n from "../../i18n";
import { isElectron } from "react-device-detect";
import JSZip from "jszip";
import { LocalFileManager } from "./localFile";
import CoverUtil from "./coverUtil";
declare var window: any;

const mergeRecords = (localRecords: any[], backupRecords: any[]): any[] => {
  const recordMap = new Map(localRecords.map((r) => [r.key, r]));
  for (const record of backupRecords) {
    recordMap.set(record.key, record);
  }
  return Array.from(recordMap.values());
};
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
export const restoreFromBrowser = async (): Promise<Boolean> => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip";
    input.onchange = async (e: any) => {
      const file: File = e.target.files[0];
      if (!file) {
        resolve(false);
        return;
      }
      toast.loading(i18n.t("Restoring..."), {
        id: "backup",
      });
      await new Promise((r) => setTimeout(r, 100));
      try {
        const fileBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(fileBuffer);
        const isNewBackup = zip.file("config/config.json") !== null;
        if (!isNewBackup) {
          resolve(false);
          return;
        }
        let failed = false;
        let processedCount = 0;
        const allFiles = Object.keys(zip.files).filter(
          (name) => !zip.files[name].dir
        );
        const totalFiles = allFiles.length;
        const updateProgress = () => {
          processedCount++;
          const percent = Math.round(
            (processedCount / Math.max(totalFiles, 1)) * 100
          );
          toast.loading(i18n.t("Restoring...") + ` (${percent}%)`, {
            id: "backup",
          });
        };
        const configFiles = Object.keys(zip.files).filter(
          (name) => name.startsWith("config/") && !zip.files[name].dir
        );
        for (const fileName of configFiles) {
          try {
            const entryName = fileName.split("/").pop() || "";
            if (entryName === "config.json") {
              const text = await zip.file(fileName)!.async("string");
              if (!text) {
                failed = true;
                break;
              }
              const config = JSON.parse(text);
              for (const key in config) ConfigService.setItem(key, config[key]);
            } else if (entryName === "sync.json") {
              const text = await zip.file(fileName)!.async("string");
              if (!text) {
                failed = true;
                break;
              }
              ConfigService.setItem("syncRecord", text);
            } else if (entryName.endsWith(".db")) {
              const buf: ArrayBuffer = await zip
                .file(fileName)!
                .async("arraybuffer");
              const sqlUtil = new SqlUtil();
              const dbName = entryName.split(".")[0];
              const cloudRecords = await sqlUtil.dbBufferToJson(buf, dbName);
              const localRecords = await DatabaseService.getAllRecords(dbName);
              const mergedRecords = mergeRecords(localRecords, cloudRecords);
              await DatabaseService.saveAllRecords(mergedRecords, dbName);
            }
            updateProgress();
          } catch {
            failed = true;
            break;
          }
        }
        if (failed) {
          resolve(false);
          return;
        }
        const isUseLocal = ConfigService.getItem("isUseLocal") === "yes";
        // Restore book files
        const bookFiles = Object.keys(zip.files).filter(
          (name) => !zip.files[name].dir && name.startsWith("book/")
        );
        await Promise.all(
          bookFiles.map(async (fileName) => {
            try {
              const entryName = fileName.split("/").pop() || "";
              const buf: ArrayBuffer = await zip
                .file(fileName)!
                .async("arraybuffer");
              if (isUseLocal) {
                await LocalFileManager.saveFile(entryName, buf, "book");
              } else {
                const key = entryName.substring(0, entryName.lastIndexOf("."));
                await localforage.setItem(key, buf);
              }
              updateProgress();
            } catch {
              failed = true;
            }
          })
        );
        // Restore cover files
        const coverFiles = Object.keys(zip.files).filter(
          (name) => !zip.files[name].dir && name.startsWith("cover/")
        );
        await Promise.all(
          coverFiles.map(async (fileName) => {
            try {
              const entryName = fileName.split("/").pop() || "";
              const buf: ArrayBuffer = await zip
                .file(fileName)!
                .async("arraybuffer");
              if (isUseLocal) {
                await LocalFileManager.saveFile(entryName, buf, "cover");
              } else {
                const ext = entryName.split(".").reverse()[0];
                const base64Str = CommonTool.arrayBufferToBase64(buf);
                const base64 = `data:image/${ext};base64,${base64Str}`;
                await CoverUtil.saveCover(entryName, base64);
              }
              updateProgress();
            } catch {
              failed = true;
            }
          })
        );
        resolve(!failed);
      } catch (error) {
        console.error("restoreFromBrowser error:", error);
        resolve(false);
      }
    };
    input.click();
  });
};

export const restore = async (service: string): Promise<Boolean> => {
  if (service === "local" && !isElectron) {
    let restoreRes = await restoreFromBrowser();
    await generateSyncRecord();
    return restoreRes;
  }
  const ipcRenderer = window.electronAPI;
  if (service === "local") {
    let filePath = await ipcRenderer.invoke("select-zip-file", "ping");
    if (!filePath) return false;
    toast.loading(i18n.t("Restoring..."), {
      id: "backup",
    });
    // 让 UI 有时间渲染 toast
    await new Promise((resolve) => setTimeout(resolve, 100));
    let restoreRes = await restoreFromfilePath(filePath);
    await generateSyncRecord();
    return restoreRes;
  } else {
    toast.loading(i18n.t("Restoring..."), {
      id: "backup",
    });
    let tokenConfig = await getCloudConfig(service);
    let result = await ipcRenderer.invoke("cloud-download", {
      ...tokenConfig,
      fileName: "data.zip",
      service: service,
      type: "backup",
      storagePath: getStorageLocation(),
    });
    if (!result) {
      console.error("no backup file");
      return false;
    }
    const path = window.electronAPI.path;
    let filePath = path.join(getStorageLocation(), "backup", "data.zip");

    // 让 UI 有时间渲染 toast
    await new Promise((resolve) => setTimeout(resolve, 100));
    let restoreRes = await restoreFromfilePath(filePath);
    await generateSyncRecord();
    return restoreRes;
  }
};
export const restoreFromSnapshot = async (fileName: string) => {
  try {
    const path = window.electronAPI.path;
    const fs = window.electronAPI.fs;
    const dataPath = getStorageLocation() || "";
    const filePath = path.join(dataPath, "snapshot", fileName);
    if (!fs.existsSync(filePath)) return false;
    const admZip = window.electronAPI.admZip;
    const databaseList = CommonTool.databaseList;
    for (let i = 0; i < databaseList.length; i++) {
      await window.electronAPI.invoke("close-database", {
        dbName: databaseList[i],
        storagePath: getStorageLocation(),
      });
      const entryName = "config/" + databaseList[i] + ".db";
      const data = await admZip.read(filePath, entryName);
      if (!data) continue;
      const destination = path.join(
        dataPath,
        "config",
        databaseList[i] + ".db"
      );
      if (fs.existsSync(destination)) fs.unlinkSync(destination);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, data);
    }
    const configData = await admZip.read(filePath, "config/config.json");
    if (configData) {
      try {
        const config = JSON.parse(new TextDecoder().decode(configData));
        for (const key in config) ConfigService.setItem(key, config[key]);
      } catch (error) {
        console.error("restore config error:", error);
      }
    }
    await generateSyncRecord();
    return true;
  } catch (error) {
    console.error("restore snapshot error:", error);
    toast.error(error instanceof Error ? error.message : String(error), {
      id: "restore-snapshot",
    });
    return false;
  }
};
export const restoreFromfilePath = async (filePath: string) => {
  const fs = window.electronAPI.fs;
  const path = window.electronAPI.path;
  if (!fs.existsSync(filePath)) return false;
  const dataPath = getStorageLocation() || "";
  const ipcRenderer = window.electronAPI;

  const progressListener = (payload: { percent: number }) => {
    toast.loading(i18n.t("Restoring...") + ` (${payload.percent}%)`, {
      id: "backup",
    });
  };
  ipcRenderer.on("restore-progress", progressListener);
  let result: any;
  try {
    result = await ipcRenderer.invoke("restore-path", {
      filePath,
      dataPath,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    toast.error(errorMessage, { id: "backup" });
    return false;
  } finally {
    ipcRenderer.removeListener("restore-progress", progressListener);
  }
  console.info(
    "restoreFromfilePath result:",
    result,
    !result || result.ok !== true,
    result && result.isNewBackup === false
  );

  if (!result || result.ok !== true) {
    if (result && result.isNewBackup === false) {
      console.warn(
        "Old backup format detected, falling back to AdmZip restoration."
      );
      // 旧备份格式：主进程不流式处理，回退到 adm-zip（遗留兼容路径）
      const admZip = window.electronAPI.admZip;
      const oldNames = await admZip.list(filePath);
      const oldEntries = oldNames.map((name: string) => ({
        name,
        getData: async () => (await admZip.read(filePath, name))!,
      }));
      return await restoreFromOldBackup(oldEntries);
    }
    const message = (result && result.error) || "Restore failed";
    toast.error(message, { id: "backup" });
    return false;
  }

  // 主进程已流式写盘资产文件，并回传 config 类文件 Buffer，在此处理。
  const configFiles: { name: string; buffer: ArrayBuffer }[] =
    result.configFiles || [];
  let failed = false;
  for (const file of configFiles) {
    try {
      const entryName = path.basename(file.name);
      if (entryName === "config.json") {
        const text = new TextDecoder().decode(file.buffer);
        if (!text) {
          failed = true;
          break;
        }
        const config = JSON.parse(text);
        for (const key in config) ConfigService.setItem(key, config[key]);
      } else if (entryName === "sync.json") {
        const text = new TextDecoder().decode(file.buffer);
        if (!text) {
          failed = true;
          break;
        }
        ConfigService.setItem("syncRecord", text);
      } else if (entryName.endsWith(".db")) {
        const sqlUtil = new SqlUtil();
        const dbName = entryName.split(".")[0];
        const cloudRecords = await sqlUtil.dbBufferToJson(file.buffer, dbName);
        await DatabaseService.saveAllRecords(cloudRecords, dbName);
      }
    } catch {
      failed = true;
      break;
    }
  }
  return !failed;
};

export const restoreFromOldBackup = async (zipEntries: any) => {
  let result = await unzipOldConfig(zipEntries);
  if (result) {
    let res = await unzipOldBook(zipEntries);
    if (res) {
      let res1 = await upgradeStorage();
      let res2 = await upgradeConfig();
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

export const unzipOldConfig = async (zipEntries: any) => {
  for (let i = 0; i < zipEntries.length; i++) {
    let zipEntry = zipEntries[i];
    if (oldConfigArr.indexOf(zipEntry.name) > -1) {
      const data = await zipEntry.getData();
      const text = new TextDecoder().decode(data);
      if (text) {
        if (
          zipEntry.name === "notes.json" ||
          zipEntry.name === "books.json" ||
          zipEntry.name === "bookmarks.json"
        ) {
          try {
            await localforage.setItem(
              zipEntry.name.split(".")[0],
              JSON.parse(text)
            );
          } catch (error) {
            console.error(`Error parsing ${zipEntry.name}:`, error);
          }
        } else if (zipEntry.name === "pdfjs.history.json") {
          ConfigService.setItem("pdfjs.history", text);
        } else {
          ConfigService.setItem(zipEntry.name.split(".")[0], text);
        }
      }
    }
  }

  ConfigService.setItem("isUpgradedStorage", "no");
  ConfigService.setItem("isUpgradedConfig", "no");
  return true;
};
export const unzipOldBook = async (zipEntries: any): Promise<boolean> => {
  const value: any = await localforage.getItem("books");
  if (!value || value.length === 0) {
    return true;
  }
  const fs = window.electronAPI.fs;
  const path = window.electronAPI.path;
  const dataPath = getStorageLocation() || "";
  const bookPath = path.join(dataPath, "book");
  if (!fs.existsSync(bookPath)) {
    fs.mkdirSync(bookPath, { recursive: true });
  }
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    for (let j = 0; j < zipEntries.length; j++) {
      const zipEntry = zipEntries[j];
      if (zipEntry.name === item.key) {
        let buffer = await zipEntry.getData();
        fs.writeFileSync(
          path.join(
            dataPath,
            "book",
            item.key + "." + item.format.toLowerCase()
          ),
          buffer
        );
        break;
      }
    }
  }
  return true;
};
