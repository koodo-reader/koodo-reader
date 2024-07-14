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
}

export default PluginList;
