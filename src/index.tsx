import React from "react";
import ReactDOM from "react-dom";
import "./assets/styles/reset.css";
import "./assets/styles/global.css";
import "./assets/styles/style.css";
import "react-tippy/dist/tippy.css";
import { Provider } from "react-redux";
import "./i18n";
import store from "./store";
import Router from "./router/index";
import OtherUtil from "./utils/otherUtil";
import { isElectron } from "react-device-detect";
import { dropdownList } from "./constants/dropdownList";

if (isElectron) {
  const { ipcRenderer } = window.require("electron");
  const { ebtRenderer } = window.require("electron-baidu-tongji");
  const BAIDU_SITE_ID = "358570be1bfc40e01db43adefade5ad5";
  ebtRenderer(ipcRenderer, BAIDU_SITE_ID, Router);
}
if (
  isElectron &&
  navigator.appVersion.indexOf("NT 6.1") === -1 &&
  navigator.appVersion.indexOf("NT 5.1") === -1 &&
  navigator.appVersion.indexOf("NT 6.0") === -1
) {
  const { ipcRenderer } = window.require("electron");
  dropdownList[0].option = ipcRenderer.sendSync("fonts-ready", "ping");
  dropdownList[0].option.push("Built-in font");
}
OtherUtil.applyTheme();
let coverLoading: any = document.querySelector(".loading-cover");
coverLoading && coverLoading.parentNode.removeChild(coverLoading);

ReactDOM.render(
  <Provider store={store}>
    <Router />
  </Provider>,
  document.getElementById("root")
);
