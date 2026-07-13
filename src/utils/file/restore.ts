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
      toast.loading(i18n.t("Restoring..."), { id: "backup" });
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
  const { ipcRenderer } = window.require("electron");
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
    const path = window.require("path");
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
    const path = window.require("path");
    const fs = window.require("fs");
    const AdmZip = window.require("adm-zip");
    const dataPath = getStorageLocation() || "";

    let filePath = path.join(getStorageLocation(), "snapshot", fileName);
    if (!fs.existsSync(filePath)) {
      return false;
    }
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();
    const zipEntryNames = new Set(
      zipEntries.map((item: any) => item.entryName)
    );
    let databaseList = CommonTool.databaseList;
    for (let i = 0; i < databaseList.length; i++) {
      await window.require("electron").ipcRenderer.invoke("close-database", {
        dbName: databaseList[i],
        storagePath: getStorageLocation(),
      });
      if (!zipEntryNames.has("config/" + databaseList[i] + ".db")) {
        continue;
      }
      if (
        fs.existsSync(path.join(dataPath, "config", databaseList[i] + ".db"))
      ) {
        fs.unlinkSync(path.join(dataPath, "config", databaseList[i] + ".db"));
      }
      zip.extractEntryTo(
        "config/" + databaseList[i] + ".db",
        path.join(dataPath, "config"),
        false,
        true
      );
    }
    try {
      let configText = zip
        .getEntry("config/config.json")
        .getData()
        .toString("utf8");
      let config = JSON.parse(configText);
      for (let key in config) {
        ConfigService.setItem(key, config[key]);
      }
    } catch (error) {
      console.error("restore config error:", error);
    }

    await generateSyncRecord();
  } catch (error) {
    console.error("restore snapshot error:", error);
    toast.error(error instanceof Error ? error.message : String(error), {
      id: "restore-snapshot",
    });
    return false;
  }

  return true;
};
export const restoreFromConfigJson = () => {
  const fs = window.require("fs");
  const path = window.require("path");
  const dataPath = getStorageLocation() || "";
  if (!fs.existsSync(path.join(dataPath, "config", "config.json"))) {
    return false;
  }
  try {
    let configStr = fs.readFileSync(
      path.join(dataPath, "config", "config.json"),
      "utf-8"
    );
    let config = JSON.parse(configStr);
    for (let key in config) {
      ConfigService.setItem(key, config[key]);
    }
  } catch (error) {
    console.error("restore config error:", error);
    return false;
  }

  return true;
};
export const restoreFromfilePath = async (filePath: string) => {
  const fs = window.require("fs");
  const path = window.require("path");
  const JSZip = window.require("jszip");
  if (!fs.existsSync(filePath)) {
    return false;
  }

  // Load zip structure lazily via Node.js stream — JSZip reads metadata upfront
  // but decompresses each file on-demand via nodeStream(), avoiding holding all
  // file contents in memory simultaneously.
  const fileBuffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(fileBuffer);

  const isNewBackup = zip.file("config/config.json") !== null;

  if (!isNewBackup) {
    // Old backup format: fall back to adm-zip (files are small in old format)
    const AdmZip = window.require("adm-zip");
    const admZip = new AdmZip(filePath);
    return await restoreFromOldBackup(admZip.getEntries());
  }

  const dataPath = getStorageLocation() || "";
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
    toast.loading(i18n.t("Restoring...") + ` (${percent}%)`, { id: "backup" });
  };

  const streamToFile = (stream: any, dest: string): Promise<void> =>
    new Promise((res, rej) => {
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const out = fs.createWriteStream(dest);
      stream.pipe(out);
      out.on("finish", res);
      out.on("error", rej);
      stream.on("error", rej);
    });

  // Process config entries first (sequential, small files)
  const configFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("config/") && !zip.files[name].dir
  );
  for (const fileName of configFiles) {
    try {
      const entryName = path.basename(fileName);
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
        const buf: ArrayBuffer = await zip.file(fileName)!.async("arraybuffer");
        const sqlUtil = new SqlUtil();
        const dbName = entryName.split(".")[0];
        const cloudRecords = await sqlUtil.dbBufferToJson(buf, dbName);
        await DatabaseService.saveAllRecords(cloudRecords, dbName);
      }
      updateProgress();
    } catch {
      failed = true;
      break;
    }
  }

  if (failed) return false;

  // Stream book and cover files to disk concurrently via nodeStream()
  const assetFiles = Object.keys(zip.files).filter(
    (name) =>
      !zip.files[name].dir &&
      (name.startsWith("book/") ||
        name.startsWith("cover/") ||
        name.startsWith("dict/") ||
        name.startsWith("background/") ||
        name.startsWith("font/") ||
        name.startsWith("snapshot/"))
  );
  await Promise.all(
    assetFiles.map(async (fileName) => {
      try {
        const dest = path.join(dataPath, fileName);
        const stream = zip.file(fileName)!.nodeStream();
        await streamToFile(stream, dest);
        updateProgress();
      } catch {
        failed = true;
      }
    })
  );

  return !failed;
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
