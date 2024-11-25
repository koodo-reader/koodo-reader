import Plugin from "../../models/Plugin";
import { generateSHA256Hash } from "../commonUtil";
declare var window: any;

class PluginService {
  static async savePlugin(plugin: Plugin) {
    if ((await generateSHA256Hash(plugin.script)) !== plugin.scriptSHA256) {
      return false;
    }
    let pluginList: Plugin[] = (await window.localforage.getItem("plugins"))
      ? await window.localforage.getItem("plugins")
      : [];
    if (
      pluginList.find(
        (item: Plugin) =>
          item.identifier === plugin.identifier &&
          item.version === plugin.version
      )
    ) {
      return false;
    }
    if (
      pluginList.find((item: Plugin) => item.identifier === plugin.identifier)
    ) {
      let oldPlugin = pluginList.find(
        (item: Plugin) => item.identifier === plugin.identifier
      );
      if (oldPlugin) {
        pluginList = pluginList.filter(
          (item: Plugin) => item.identifier !== plugin.identifier
        );
      }
    }
    pluginList.push(plugin);

    await window.localforage.setItem("plugins", pluginList);
    return true;
  }
  static async getPluginById(identifier: string) {
    let pluginList = (await window.localforage.getItem("plugins"))
      ? await window.localforage.getItem("plugins")
      : [];
    return (pluginList.find((item: Plugin) => item.identifier === identifier) ||
      {}) as Plugin;
  }
  static async getAllPlugins() {
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
  static async saveAllPlugins(plugins: Plugin[]) {
    await window.localforage.setItem("plugins", plugins);
  }
  static async deletePluginById(identifier: string) {
    let pluginList = (await window.localforage.getItem("plugins"))
      ? await window.localforage.getItem("plugins")
      : [];
    let newPluginList = pluginList.filter(
      (item: Plugin) => item.identifier !== identifier
    );
    await window.localforage.setItem("plugins", newPluginList);
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
}

export default PluginService;
