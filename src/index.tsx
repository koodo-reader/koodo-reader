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
import StyleUtil from "./utils/readUtils/styleUtil";
import { isElectron } from "react-device-detect";
import { dropdownList } from "./constants/dropdownList";
import StorageUtil from "./utils/serviceUtils/storageUtil";
import ga from "./utils/serviceUtils/analytics";

ReactDOM.render(
  <Provider store={store}>
    <Router />
  </Provider>,
  document.getElementById("root")
);

let coverLoading: any = document.querySelector(".loading-cover");
coverLoading && coverLoading.parentNode.removeChild(coverLoading);

if (isElectron && StorageUtil.getReaderConfig("isDisableAnalytics") !== "yes") {
  ga.event("Client", "show", {
    evLabel: "startup",
  });
} else if (StorageUtil.getReaderConfig("isDisableAnalytics") === "yes") {
  ga.removeScript();
}
if (isElectron) {
  const fontList = window.require("font-list");
  fontList.getFonts({ disableQuoting: true }).then((result) => {
    if (!result || result.length === 0) return;
    dropdownList[0].option = result;
    dropdownList[0].option.push("Built-in font");
  });
}
StyleUtil.applyTheme();
