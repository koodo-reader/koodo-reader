import SyncService from "../storage/syncService";
import {
  ConfigService,
  CommonTool,
} from "../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../storage/databaseService";
import SqlUtil from "./sqlUtil";

class ConfigUtil {
  static async downloadConfig(type: string) {
    let syncUtil = await SyncService.getSyncUtil();
    let jsonBuffer: ArrayBuffer = await syncUtil.downloadFile(
      type + ".json",
      "config"
    );
    let jsonStr = new TextDecoder().decode(jsonBuffer);
    return jsonStr;
  }
  static async uploadConfig(type: string) {
    let config = {};
    if (type === "sync") {
      config = ConfigService.getAllSyncRecord();
    } else {
      let configList = CommonTool.configList;
      for (let i = 0; i < configList.length; i++) {
        let item = configList[i];
        if (localStorage.getItem(item)) {
          config[item] = localStorage.getItem(item);
        }
      }
    }
    let syncUtil = await SyncService.getSyncUtil();
    let configBlob = new Blob([JSON.stringify(config)], {
      type: "application/json",
    });
    await syncUtil.uploadFile(type + ".json", "config", configBlob);
  }
  static async getCloudConfig(type: string) {
    let configStr = await ConfigUtil.downloadConfig(type);
    console.log(configStr, "configStr");
    return JSON.parse(configStr);
  }
  static async downloadDatabase(type: string) {
    let syncUtil = await SyncService.getSyncUtil();
    let dbBuffer = await syncUtil.downloadFile(type + ".db", "config");
    let sqlUtil = new SqlUtil();
    return await sqlUtil.dbBufferToJson(dbBuffer, type);
  }
  static async getCloudDatabase(database: string) {
    let cloudRecords = await this.downloadDatabase(database);
    console.log(cloudRecords, "cloudRecords");
    return cloudRecords;
  }
  static async uploadDatabase(type: string) {
    let dbBuffer = await DatabaseService.getDbBuffer(type);
    let dbBlob = new Blob([dbBuffer], { type: CommonTool.getMimeType("db") });
    let syncUtil = await SyncService.getSyncUtil();
    await syncUtil.uploadFile(type + ".db", "config", dbBlob);
  }

  static async dumpConfig(type: string) {
    let config = {};
    if (type === "sync") {
      config = ConfigService.getAllSyncRecord();
    } else {
      let configList = CommonTool.configList;
      for (let i = 0; i < configList.length; i++) {
        let item = configList[i];
        if (localStorage.getItem(item)) {
          config[item] = localStorage.getItem(item);
        }
      }
    }
    return config;
  }
  static clearConfig(type: string) {
    if (type === "sync") {
      localStorage.removeItem("syncRecord");
    } else {
      let configList = CommonTool.configList;
      for (let i = 0; i < configList.length; i++) {
        let item = configList[i];
        localStorage.removeItem(item);
      }
    }
  }
  static async loadConfig(type: string, configStr: string) {
    let tempConfig = JSON.parse(configStr);
    if (type === "sync") {
      ConfigService.setAllSyncRecord(tempConfig);
    } else {
      for (let key in tempConfig) {
        localStorage.setItem(key, tempConfig[key]);
      }
    }
  }
}
export default ConfigUtil;
