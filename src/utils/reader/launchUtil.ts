import {
  browserName,
  browserVersion,
  isBrowser,
  isElectron,
  osName,
  osVersion,
} from "react-device-detect";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import packageJson from "../../../package.json";
export const initTheme = () => {
  const style = document.createElement("link");
  style.rel = "stylesheet";
  let isNight = false;
  if (isElectron) {
    const { ipcRenderer } = window.require("electron");
    isNight = ipcRenderer.sendSync("system-color");
  } else {
    isNight =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  ConfigService.setReaderConfig("isOSNight", isNight ? "yes" : "no");
  ConfigService.setItem("appVersion", packageJson.version);
  ConfigService.setItem(
    "appPlatform",
    isElectron ? osName + " " + osVersion : browserName + " " + browserVersion
  );
  if (!ConfigService.getReaderConfig("appSkin")) {
    ConfigService.setReaderConfig("appSkin", "system");
    //new user don't need to upgrade
    ConfigService.setItem("isUpgradedConfig", "yes");
    ConfigService.setItem("isUpgradedStorage", "yes");
    if (isNight) {
    }
  }
  if (
    ConfigService.getReaderConfig("appSkin") === "night" ||
    (ConfigService.getReaderConfig("appSkin") === "system" &&
      ConfigService.getReaderConfig("isOSNight") === "yes")
  ) {
    style.href = "./assets/styles/dark.css";
  } else {
    style.href = "./assets/styles/default.css";
  }
  document.head.appendChild(style);
};
export const initSystemFont = () => {
  if (ConfigService.getReaderConfig("systemFont")) {
    let body = document.getElementsByTagName("body")[0];
    body.setAttribute(
      "style",
      "font-family:" +
        ConfigService.getReaderConfig("systemFont") +
        "!important"
    );
  }
};
