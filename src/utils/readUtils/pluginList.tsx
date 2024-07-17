import Plugin from "../../models/Plugin";
import { getStrSHA256 } from "../commonUtil";

class PluginList {
  static addPlugin(plugin: Plugin) {
    if (getStrSHA256(plugin.script) !== plugin.scriptSHA256) {
      return false;
    }
    let pluginList: Plugin[] =
      localStorage.getItem("pluginList") !== "{}" &&
      localStorage.getItem("pluginList")
        ? JSON.parse(localStorage.getItem("pluginList") || "")
        : [];
    if (
      pluginList.find((item: Plugin) => item.identifier === plugin.identifier)
    ) {
      return false;
    }

    pluginList.push(plugin);

    localStorage.setItem("pluginList", JSON.stringify(pluginList));
    return true;
  }
  static getPluginById(identifier: string) {
    let pluginList =
      localStorage.getItem("pluginList") !== "{}" &&
      localStorage.getItem("pluginList")
        ? (JSON.parse(localStorage.getItem("pluginList") || "") as Plugin[])
        : [];
    return (pluginList.find((item: Plugin) => item.identifier === identifier) ||
      {}) as Plugin;
  }
  static getAllPlugins() {
    let pluginList =
      localStorage.getItem("pluginList") !== "{}" &&
      localStorage.getItem("pluginList")
        ? (JSON.parse(localStorage.getItem("pluginList") || "") as Plugin[])
        : [];
    return pluginList || [];
  }
  static deletePluginById(identifier: string) {
    let pluginList =
      localStorage.getItem("pluginList") !== "{}" &&
      localStorage.getItem("pluginList")
        ? (JSON.parse(localStorage.getItem("pluginList") || "") as Plugin[])
        : [];
    let newPluginList = pluginList.filter(
      (item: Plugin) => item.identifier !== identifier
    );
    localStorage.setItem("pluginList", JSON.stringify(newPluginList));
  }
  static getAllVoices() {
    let pluginList =
      localStorage.getItem("pluginList") !== "{}" &&
      localStorage.getItem("pluginList")
        ? (JSON.parse(localStorage.getItem("pluginList") || "") as Plugin[])
        : [];
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

export default PluginList;
