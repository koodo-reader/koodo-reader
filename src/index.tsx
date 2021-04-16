import React from "react";
import ReactDOM from "react-dom";
// import App from "./App";
import "./assets/styles/reset.css";
import "./assets/styles/global.css";
import "./assets/styles/style.css";
import "react-tippy/dist/tippy.css";
import { Provider } from "react-redux";
import "./i18n";
import store from "./store";
import Router from "./router/index";
import { isElectron } from "react-device-detect";

if (isElectron) {
  const { ipcRenderer } = window.require("electron");
  const { ebtRenderer } = window.require("electron-baidu-tongji");
  ebtRenderer(ipcRenderer, "358570be1bfc40e01db43adefade5ad5", Router);
}

let coverLoading: any = document.querySelector(".loading-cover");
coverLoading && coverLoading.parentNode.removeChild(coverLoading);

ReactDOM.render(
  <Provider store={store}>
    <Router />
  </Provider>,
  document.getElementById("root")
);
