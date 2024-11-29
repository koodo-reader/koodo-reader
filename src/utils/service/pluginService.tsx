import { isElectron } from "react-device-detect";
import Plugin from "../../models/Plugin";
import { generateSHA256Hash, getStorageLocation } from "../common";
import SqlUtil from "../file/sqlUtil";
declare var window: any;

class PluginService {
  static async getDbBuffer() {
    let sqlUtil = new SqlUtil();
    let plugins = await this.getAllPlugins();
    return sqlUtil.JsonToDbBuffer(plugins, "plugins");
  }

  static async getAllPlugins() {
    if (isElectron) {
      let plugins = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getAllStatement",
          statementType: "string",
          executeType: "all",
          dbName: "plugins",
          storagePath: getStorageLocation(),
        });
      return plugins;
    } else {
      let pluginList = await window.localforage.getItem("plugins");
      if (!pluginList) {
        pluginList =
          localStorage.getItem("pluginList") !== "{}" &&
          localStorage.getItem("pluginList")
            ? JSON.parse(localStorage.getItem("pluginList") || "")
            : [];
      }
      return pluginList || [];
    }
  }
  static async saveAllPlugins(plugins: Plugin[]) {
    if (isElectron) {
      for (let plugin of plugins) {
        await window
          .require("electron")
          .ipcRenderer.invoke("database-command", {
            statement: "saveStatement",
            statementType: "string",
            executeType: "run",
            dbName: "plugins",
            data: plugin,
            storagePath: getStorageLocation(),
          });
      }
    } else {
      await window.localforage.setItem("plugins", plugins);
    }
  }

  static async savePlugin(plugin: Plugin) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "saveStatement",
        statementType: "string",
        executeType: "run",
        dbName: "plugins",
        data: plugin,
        storagePath: getStorageLocation(),
      });
    } else {
      let plugins = await this.getAllPlugins();
      plugins.push(plugin);
      await this.saveAllPlugins(plugins);
    }
  }
  static async updatePlugin(plugin: Plugin) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "updateStatement",
        statementType: "string",
        executeType: "run",
        dbName: "plugins",
        data: plugin,
        storagePath: getStorageLocation(),
      });
    } else {
      let pluginList = await this.getAllPlugins();
      let newPluginList = pluginList.map((item: Plugin) => {
        if (item.identifier === plugin.identifier) {
          return plugin;
        }
        return item;
      });
      await this.saveAllPlugins(newPluginList);
    }
  }

  static async deletePlugin(identifier: string) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "deleteStatement",
        statementType: "string",
        executeType: "run",
        dbName: "plugins",
        data: identifier,
        storagePath: getStorageLocation(),
      });
    } else {
      let pluginList = await this.getAllPlugins();
      let newPluginList = pluginList.filter(
        (item: Plugin) => item.identifier !== identifier
      );
      await this.saveAllPlugins(newPluginList);
    }
  }
  static getAllVoices(pluginList: Plugin[]) {
    let voiceList: any[] = [];
    for (
      let index = 0;
      index < pluginList.filter((item) => item.type === "voice").length;
      index++
    ) {
      const plugin = pluginList.filter((item) => item.type === "voice")[index];
      voiceList.push(...(plugin.voiceList as any[]));
    }
    return voiceList;
  }
  static async checkPlugin(plugin: Plugin) {
    console.log(plugin, await generateSHA256Hash(plugin.script));
    if ((await generateSHA256Hash(plugin.script)) !== plugin.scriptSHA256) {
      return false;
    } else {
      return true;
    }
  }
}

export default PluginService;
