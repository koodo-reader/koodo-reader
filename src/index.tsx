import React from "react";
import { createRoot } from "react-dom/client";
import "./assets/styles/reset.css";
import "./assets/styles/global.css";
import "./assets/styles/style.css";
import { Provider } from "react-redux";
import "./i18n";
import store from "./store";
import Router from "./router/index";
import StyleUtil from "./utils/reader/styleUtil";
import {
  initSystemFont,
  initTheme,
  applyCustomSystemCSS,
  applyAppBackgroundImage,
} from "./utils/reader/launchUtil";
import { migrateThemeConfig } from "./utils/reader/themeUtil";
initTheme();
initSystemFont();
migrateThemeConfig();
applyCustomSystemCSS();
applyAppBackgroundImage();
const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <Router />
  </Provider>
);
StyleUtil.applyTheme();
