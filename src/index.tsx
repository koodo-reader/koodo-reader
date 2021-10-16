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
import OtherUtil from "./utils/otherUtil";
import ga from "./utils/analytics";

ReactDOM.render(
  <Provider store={store}>
    <Router />
  </Provider>,
  document.getElementById("root")
);

let coverLoading: any = document.querySelector(".loading-cover");
coverLoading && coverLoading.parentNode.removeChild(coverLoading);

if (isElectron && OtherUtil.getReaderConfig("isDisableAnalytics") !== "yes") {
  ga.event("Client", "show", {
    evLabel: "startup",
  });
}
if (
  isElectron &&
  navigator.appVersion.indexOf("NT 6.1") === -1 &&
  navigator.appVersion.indexOf("NT 5.1") === -1 &&
  navigator.appVersion.indexOf("NT 6.0") === -1
) {
  const fontList = window.require("font-list");
  fontList.getFonts({ disableQuoting: true }).then((result) => {
    dropdownList[0].option = result;
    dropdownList[0].option.push("Built-in font");
  });
}
StyleUtil.applyTheme();
