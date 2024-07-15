import Plugin from "../../models/Plugin";

class PluginList {
  static addPlugin(plugin: Plugin) {
    let pluginList =
      localStorage.getItem("pluginList") !== "{}" &&
      localStorage.getItem("pluginList")
        ? JSON.parse(localStorage.getItem("pluginList") || "")
        : [];

    pluginList.push(plugin);

    localStorage.setItem("pluginList", JSON.stringify(pluginList));
  }
  static getPluginById(identifier: string) {
    let pluginList =
      localStorage.getItem("pluginList") !== "{}" &&
      localStorage.getItem("pluginList")
        ? (JSON.parse(localStorage.getItem("pluginList") || "") as Plugin[])
        : [];
    return (
      pluginList.find((item: Plugin) => item.identifier === identifier) ||
      ({} as Plugin)
    );
  }
  static getAllPlugins() {
    let pluginList =
      localStorage.getItem("pluginList") !== "{}" &&
      localStorage.getItem("pluginList")
        ? (JSON.parse(localStorage.getItem("pluginList") || "") as Plugin[])
        : [];
    return pluginList || [];
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
