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
import * as serviceWorker from "./serviceWorker";
let coverLoading: any = document.querySelector(".loading-cover");
coverLoading && coverLoading.parentNode.removeChild(coverLoading);

ReactDOM.render(
  <Provider store={store}>
    <Router />
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA

serviceWorker.unregister();
