import {
  browserName,
  browserVersion,
  isElectron,
  osName,
  osVersion,
} from "react-device-detect";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import packageJson from "../../../package.json";
import BackgroundUtil from "../file/backgroundUtil";
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

export const applyCustomSystemCSS = () => {
  const isCustomSystemCSS =
    ConfigService.getReaderConfig("isCustomSystemCSS") === "yes";
  const customSystemCSS =
    ConfigService.getReaderConfig("customSystemCSS") || "";
  let styleElement = document.getElementById("custom-system-style");
  if (isCustomSystemCSS && customSystemCSS) {
    if (styleElement) {
      styleElement.textContent = customSystemCSS;
    } else {
      const style = document.createElement("style");
      style.id = "custom-system-style";
      style.textContent = customSystemCSS;
      document.head.appendChild(style);
    }
  } else if (styleElement) {
    styleElement.textContent = "";
  }
};

export const applyAppBackgroundImage = async () => {
  const imageId = ConfigService.getReaderConfig("appBackgroundImage") || "";
  const root = document.getElementById("root");
  if (!root) return;
  if (imageId) {
    const meta = BackgroundUtil.getImageMeta(imageId);
    const imageUrl = await BackgroundUtil.loadImage(imageId, meta?.extension);
    if (imageUrl) {
      root.style.backgroundImage = `url("${imageUrl}")`;
      root.style.backgroundSize = "cover";
      root.style.backgroundPosition = "center";
      root.style.backgroundAttachment = "fixed";
      return;
    }
  }
  root.style.backgroundImage = "";
  root.style.backgroundSize = "";
  root.style.backgroundPosition = "";
  root.style.backgroundAttachment = "";
};
