import SyncService from "../storage/syncService";
import {
  ConfigService,
  CommonTool,
  SqlStatement,
} from "../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../storage/databaseService";
import SqlUtil from "./sqlUtil";
import { isElectron } from "react-device-detect";
import { getStorageLocation } from "../common";
import { getCloudConfig } from "./common";
import { getThirdpartyRequest } from "../request/thirdparty";
import { handleExitApp } from "../request/common";
import toast from "react-hot-toast";
import i18n from "../../i18n";
import Note from "../../models/Note";

class ConfigUtil {
  public static syncData: any = {};
  public static updateData: any = {};
  static async downloadConfig(type: string) {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let service = ConfigService.getItem("defaultSyncOption");
      if (!service) {
        return;
      }
      let tokenConfig = await getCloudConfig(service);
      let result = await ipcRenderer.invoke("cloud-download", {
        ...tokenConfig,
        fileName: type + ".json",
        service: service,
        type: "config",
        storagePath: getStorageLocation(),
      });
      if (!result) {
        console.error("no config file");
        return "{}";
      }
      let fs = window.require("fs");
      if (!fs.existsSync(getStorageLocation() + "/config/" + type + ".json")) {
        return "{}";
      }
      let configStr = fs.readFileSync(
        getStorageLocation() + "/config/" + type + ".json",
        "utf-8"
      );
      return configStr;
    } else {
      let syncUtil = await SyncService.getSyncUtil();
      let jsonBuffer: ArrayBuffer = await syncUtil.downloadFile(
        type + ".json",
        "config"
      );
      if (!jsonBuffer) {
        return "{}";
      }
      let jsonStr = new TextDecoder().decode(jsonBuffer);
      return jsonStr;
    }
  }
  static async uploadConfig(type: string) {
    let config = {};
    if (type === "sync") {
      config = ConfigService.getAllSyncRecord();
    } else {
      let configList = CommonTool.configList;
      for (let i = 0; i < configList.length; i++) {
        let item = configList[i];
        if (ConfigService.getItem(item)) {
          config[item] = ConfigService.getItem(item);
        }
      }
    }
    if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
      this.updateData[type] = JSON.stringify(config);
      return;
    }
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let service = ConfigService.getItem("defaultSyncOption");
      if (!service) {
        return;
      }
      let tokenConfig = await getCloudConfig(service);
      let fs = window.require("fs");
      if (!fs.existsSync(getStorageLocation() + "/config")) {
        fs.mkdirSync(getStorageLocation() + "/config", { recursive: true });
      }
      fs.writeFileSync(
        getStorageLocation() + "/config/" + type + ".json",
        JSON.stringify(config)
      );

      await ipcRenderer.invoke("cloud-upload", {
        ...tokenConfig,
        fileName: type + ".json",
        service: service,
        type: "config",
        storagePath: getStorageLocation(),
      });
    } else {
      let syncUtil = await SyncService.getSyncUtil();
      let configBlob = new Blob([JSON.stringify(config)], {
        type: "application/json",
      });
      await syncUtil.uploadFile(type + ".json", "config", configBlob);
    }
  }
  static async getSyncData(type: string) {
    let defaultValue = type === "sync" || type === "config" ? "{}" : "[]";
    if (this.syncData[type]) {
      return JSON.parse(this.syncData[type] || defaultValue);
    }
    let thirdpartyRequest = await getThirdpartyRequest();

    let response = await thirdpartyRequest.getSyncDataByType({ type });
    if (response.code === 200) {
      this.syncData[type] = response.data;
      return JSON.parse(this.syncData[type] || defaultValue);
    } else if (response.code === 401) {
      handleExitApp();
      return null;
    } else {
      toast.error(
        i18n.t("Synchronization failed, error code") + ": " + response.msg
      );
      if (response.code === 20004) {
        toast(
          i18n.t("Please login again to update your membership on this device")
        );
      }
      return null;
    }
  }
  static async updateSyncData() {
    let thirdpartyRequest = await getThirdpartyRequest();

    let response = await thirdpartyRequest.updateSyncData(this.updateData);
    if (response.code === 200) {
    } else if (response.code === 401) {
      handleExitApp();
    } else {
      toast.error(
        i18n.t("Synchronization failed, error code") + ": " + response.msg
      );
      if (response.code === 20004) {
        toast(
          i18n.t("Please login again to update your membership on this device")
        );
      }
    }

    this.syncData = {};
    this.updateData = {};
  }
  static async getCloudConfig(type: string) {
    if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
      let config = await this.getSyncData(type);
      return config || {};
    }
    let configStr = (await ConfigUtil.downloadConfig(type)) || "{}";
    return JSON.parse(configStr);
  }

  static async getCloudDatabase(database: string) {
    if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
      let data = await this.getSyncData(database);
      return data || [];
    }
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let service = ConfigService.getItem("defaultSyncOption");
      if (!service) {
        return;
      }
      let tokenConfig = await getCloudConfig(service);

      let result = await ipcRenderer.invoke("cloud-download", {
        ...tokenConfig,
        fileName: database + ".db",
        service: service,
        type: "config",
        isTemp: true,
        storagePath: getStorageLocation(),
      });
      if (!result) {
        console.error("no database file");
        return [];
      }
      let cloudRecords = await DatabaseService.getAllRecords(
        "temp-" + database
      );
      await ipcRenderer.invoke("close-database", {
        dbName: "temp-" + database,
        storagePath: getStorageLocation(),
      });
      return cloudRecords;
    } else {
      let syncUtil = await SyncService.getSyncUtil();
      let dbBuffer = await syncUtil.downloadFile(database + ".db", "config");
      if (!dbBuffer) {
        return [];
      }
      let sqlUtil = new SqlUtil();
      let cloudRecords = await sqlUtil.dbBufferToJson(dbBuffer, database);
      return cloudRecords;
    }
  }
  static async uploadDatabase(type: string) {
    if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
      let data = await DatabaseService.getAllRecords(type);
      if (type === "books") {
        data = data.map((record) => {
          record.cover = "";
          return record;
        });
      }
      this.updateData[type] = JSON.stringify(data);
      return;
    }
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      await ipcRenderer.invoke("close-database", {
        dbName: type,
        storagePath: getStorageLocation(),
      });
      let service = ConfigService.getItem("defaultSyncOption");
      if (!service) {
        return;
      }
      let tokenConfig = await getCloudConfig(service);

      return await ipcRenderer.invoke("cloud-upload", {
        ...tokenConfig,
        fileName: type + ".db",
        service: service,
        type: "config",
        storagePath: getStorageLocation(),
      });
    } else {
      let dbBuffer = await DatabaseService.getDbBuffer(type);
      let dbBlob = new Blob([dbBuffer], { type: CommonTool.getMimeType("db") });
      let syncUtil = await SyncService.getSyncUtil();
      await syncUtil.uploadFile(type + ".db", "config", dbBlob);
    }
  }
  static async getNotesByBookKeyAndTypeWithSort(
    bookKey: string,
    type: string,
    sort: string = "key",
    order: string = "DESC"
  ) {
    if (isElectron) {
      let queryString = "";
      let data: any[] = [];
      if (type === "note" && bookKey) {
        queryString = `SELECT key, bookKey, chapterIndex FROM notes WHERE bookKey = ? AND notes != '' ORDER BY ${sort} ${order}`;
        data = [bookKey];
      } else if (type === "highlight" && bookKey) {
        queryString = `SELECT key, bookKey, chapterIndex FROM notes WHERE bookKey = ? AND notes = '' ORDER BY ${sort} ${order}`;
        data = [bookKey];
      } else if (type === "note" && !bookKey) {
        queryString = `SELECT key, bookKey, chapterIndex FROM notes WHERE notes != '' ORDER BY ${sort} ${order}`;
      } else if (type === "highlight" && !bookKey) {
        queryString = `SELECT key, bookKey, chapterIndex FROM notes WHERE notes = '' ORDER BY ${sort} ${order}`;
      } else if (!type && bookKey) {
        queryString = `SELECT key, bookKey, chapterIndex FROM notes WHERE bookKey = ? ORDER BY ${sort} ${order}`;
        data = [bookKey];
      } else {
        queryString = `SELECT key, bookKey, chapterIndex FROM notes ORDER BY ${sort} ${order}`;
      }
      const { ipcRenderer } = window.require("electron");
      return await ipcRenderer.invoke("custom-database-command", {
        dbName: "notes",
        storagePath: getStorageLocation(),
        query: queryString,
        data: data,
        executeType: "all",
      });
    } else {
      let notes: Note[] = await DatabaseService.getAllRecords("notes");
      let filteredNotes = notes.filter((note) => {
        let typeMatch =
          (type === "note" && note.notes !== "") ||
          (type === "highlight" && note.notes === "") ||
          !type;
        let bookKeyMatch = bookKey ? note.bookKey === bookKey : true;
        return typeMatch && bookKeyMatch;
      });
      if (sort === "key") {
        filteredNotes.sort((a, b) => {
          if (order === "ASC") {
            return Number(a.key) - Number(b.key);
          } else {
            return Number(b.key) - Number(a.key);
          }
        });
      } else if (sort === "percentage") {
        filteredNotes.sort((a, b) => {
          if (order === "ASC") {
            return Number(a.percentage) - Number(b.percentage);
          } else {
            return Number(b.percentage) - Number(a.percentage);
          }
        });
      }
      return filteredNotes;
    }
  }
  static async searchNotesByKeyword(
    keyword: string,
    bookKey: string,
    type: string
  ) {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let queryString = "";
      let data: any[] = [];
      if (type === "note" && bookKey) {
        queryString = `SELECT * FROM notes WHERE bookKey = ? AND (notes LIKE ? OR text LIKE ?) ORDER BY key DESC`;
        data = [
          bookKey,
          `%${keyword.toLowerCase()}%`,
          `%${keyword.toLowerCase()}%`,
        ];
      } else if (type === "highlight" && bookKey) {
        queryString = `SELECT * FROM notes WHERE bookKey = ? AND (notes = '' AND (notes LIKE ? OR text LIKE ?)) ORDER BY key DESC`;
        data = [
          bookKey,
          `%${keyword.toLowerCase()}%`,
          `%${keyword.toLowerCase()}%`,
        ];
      } else if (type === "note" && !bookKey) {
        queryString = `SELECT * FROM notes WHERE (notes != '' AND (notes LIKE ? OR text LIKE ?)) ORDER BY key DESC`;
        data = [`%${keyword.toLowerCase()}%`, `%${keyword.toLowerCase()}%`];
      } else if (type === "highlight" && !bookKey) {
        queryString = `SELECT * FROM notes WHERE (notes = '' AND (notes LIKE ? OR text LIKE ?)) ORDER BY key DESC`;
        data = [`%${keyword.toLowerCase()}%`, `%${keyword.toLowerCase()}%`];
      } else if (!type && bookKey) {
        queryString = `SELECT * FROM notes WHERE bookKey = ? AND (notes LIKE ? OR text LIKE ?) ORDER BY key DESC`;
        data = [
          bookKey,
          `%${keyword.toLowerCase()}%`,
          `%${keyword.toLowerCase()}%`,
        ];
      } else {
        queryString = `SELECT * FROM notes WHERE (notes LIKE ? OR text LIKE ?) ORDER BY key DESC`;
        data = [`%${keyword.toLowerCase()}%`, `%${keyword.toLowerCase()}%`];
      }
      return await ipcRenderer.invoke("custom-database-command", {
        dbName: "notes",
        storagePath: getStorageLocation(),
        query: queryString,
        data: data,
        executeType: "all",
      });
    } else {
      let notes = await DatabaseService.getAllRecords("notes");
      let filteredNotes = notes.filter(
        (note) =>
          ((type === "note" && note.notes !== "") ||
            (type === "highlight" && note.notes === "") ||
            !type) &&
          (note.bookKey === bookKey || !bookKey) &&
          (note.notes.toLowerCase().includes(keyword.toLowerCase()) ||
            note.text.toLowerCase().includes(keyword.toLowerCase()))
      );
      filteredNotes.sort((a, b) => b.key - a.key);
      return filteredNotes;
    }
  }
  static async getNoteWithTags(tags: string[]) {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let queryString = "";
      let data: any[] = [];
      if (tags.length > 0) {
        let instrArr = tags.map(() => "instr(tag, ?) > 0").join(" AND ");
        queryString = `SELECT * FROM notes WHERE ${instrArr} ORDER BY key DESC`;
        data = tags;
      } else {
        queryString = `SELECT * FROM notes ORDER BY key DESC`;
      }
      return await ipcRenderer.invoke("custom-database-command", {
        dbName: "notes",
        storagePath: getStorageLocation(),
        query: queryString,
        data: data,
        executeType: "all",
      });
    } else {
      let notes = await DatabaseService.getAllRecords("notes");
      let filteredNotes = notes.filter((note) => {
        for (let i = 0; i < tags.length; i++) {
          if (!note.tag.includes(tags[i])) {
            return false;
          }
        }
        return true;
      });
      filteredNotes.sort((a, b) => b.key - a.key);
      return filteredNotes;
    }
  }
  static async deleteTagFromNotes(tagName: string) {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let rawNotes: any[] = await ipcRenderer.invoke(
        "custom-database-command",
        {
          dbName: "notes",
          storagePath: getStorageLocation(),
          query: `SELECT * FROM notes WHERE instr(tag, ?) > 0`,
          data: [tagName],
          executeType: "all",
        }
      );
      let notes = rawNotes.map((item) =>
        SqlStatement.sqliteToJson["notes"](item)
      );
      let updatedNotes = notes.map((item) => {
        return {
          ...item,
          tag: item.tag.filter((subitem: string) => subitem !== tagName),
        };
      });
      for (let i = 0; i < updatedNotes.length; i++) {
        await ipcRenderer.invoke("custom-database-command", {
          dbName: "notes",
          storagePath: getStorageLocation(),
          query: `UPDATE notes SET tag = ? WHERE key = ?`,
          data: [JSON.stringify(updatedNotes[i].tag), updatedNotes[i].key],
          executeType: "run",
        });
      }
    } else {
      let notes: any[] = await DatabaseService.getAllRecords("notes");
      let filteredNotes = notes.filter((note) => note.tag.includes(tagName));
      let updatedNotes = filteredNotes.map((item) => {
        return {
          ...item,
          tag: item.tag.filter((subitem) => subitem !== tagName),
        };
      });
      for (let i = 0; i < updatedNotes.length; i++) {
        await DatabaseService.updateRecord(updatedNotes[i], "notes");
      }
    }
  }
  static async getNoteList() {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let queryString = `SELECT key, bookKey, chapterIndex FROM notes ORDER BY key DESC`;
      return await ipcRenderer.invoke("custom-database-command", {
        dbName: "notes",
        storagePath: getStorageLocation(),
        query: queryString,
        executeType: "all",
      });
    } else {
      let notes = await DatabaseService.getAllRecords("notes");
      notes.sort((a, b) => b.key - a.key);
      return notes;
    }
  }
  static async dumpConfig(type: string) {
    let config = {};
    if (type === "sync") {
      config = ConfigService.getAllSyncRecord();
    } else {
      let configList = CommonTool.configList;
      for (let i = 0; i < configList.length; i++) {
        let item = configList[i];
        if (ConfigService.getItem(item)) {
          config[item] = ConfigService.getItem(item);
        }
      }
    }
    return config;
  }
  static clearConfig(type: string) {
    if (type === "sync") {
      ConfigService.removeItem("syncRecord");
    } else {
      let configList = CommonTool.configList;
      for (let i = 0; i < configList.length; i++) {
        let item = configList[i];
        ConfigService.removeItem(item);
      }
    }
  }
  static async loadConfig(type: string, configStr: string) {
    let tempConfig = JSON.parse(configStr);
    if (type === "sync") {
      ConfigService.setAllSyncRecord(tempConfig);
    } else {
      for (let key in tempConfig) {
        ConfigService.setItem(key, tempConfig[key]);
      }
    }
  }
  static async isCloudEmpty() {
    let syncDataStr = await this.downloadConfig("sync");
    let syncData = JSON.parse(syncDataStr || "{}");
    if (!syncData || Object.keys(syncData).length === 0) {
      return true;
    }
    return false;
  }
}
export default ConfigUtil;
