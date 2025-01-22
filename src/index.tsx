import React from "react";
import ReactDOM from "react-dom";
import "./assets/styles/reset.css";
import "./assets/styles/global.css";
import "./assets/styles/style.css";
import { Provider } from "react-redux";
import "./i18n";
import store from "./store";
import Router from "./router/index";
import StyleUtil from "./utils/reader/styleUtil";
import { isElectron } from "react-device-detect";
import { dropdownList } from "./constants/dropdownList";
import { initSystemFont, initTheme } from "./utils/reader/launchUtil";
declare var window: any;
initTheme();
initSystemFont();
ReactDOM.render(
  <Provider store={store}>
    <Router />
  </Provider>,
  document.getElementById("root")
);
StyleUtil.applyTheme();
