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
import OtherUtil from "./utils/otherUtil";
if (OtherUtil.getReaderConfig("isDisplayDark") === "yes") {
  require("./assets/styles/dark.css");
} else {
  require("./assets/styles/default.css");
}

let coverLoading: any = document.querySelector(".loading-cover");
coverLoading && coverLoading.parentNode.removeChild(coverLoading);

ReactDOM.render(
  <Provider store={store}>
    <Router />
  </Provider>,
  document.getElementById("root")
);
