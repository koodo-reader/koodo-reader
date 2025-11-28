import SyncService from "../storage/syncService";
import {
  ConfigService,
  CommonTool,
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
}
export default ConfigUtil;
