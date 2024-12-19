import React from "react";
import ReactDOM from "react-dom";
import "./assets/styles/reset.css";
import "./assets/styles/global.css";
import "./assets/styles/style.css";
import { Provider } from "react-redux";
import "./i18n";
import store from "./store";
import Router from "./router/index";
import StyleUtil from "./utils/readUtils/styleUtil";
// import { isElectron } from "react-device-detect";
// import { dropdownList } from "./constants/dropdownList";
// import StorageUtil from "./utils/serviceUtils/storageUtil";
import { initSystemFont, initTheme } from "./utils/serviceUtils/launchUtil";
import * as serviceWorker from './serviceWorker';
declare var window: any;
initTheme();
initSystemFont();

ReactDOM.render(
  <Provider store={store}>
    <Router />
  </Provider>,
  document.getElementById("root")
);
// if (isElectron) {
//   const fontList = window.require("font-list");
//   fontList.getFonts({ disableQuoting: true }).then((result) => {
//     if (!result || result.length === 0) return;
//     dropdownList[0].option = result;
//     dropdownList[0].option.push("Arial");
//   });
// }
StyleUtil.applyTheme();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
// const CACHE_NAME = "cache_sample";
// const urlsToCache = ["index.html", "offline.html"];
// const version = "v0.0.1";//install sw at first time
// //place to cache assets to speed up the loading time of web page
// self.addEventListener("install", (event: any) => {
//   console.log("sw install event");
//   event.waitUntil(
//     caches.open(version + CACHE_NAME).then((cache) => {
//       console.log("opened cache");
//       return cache.addAll(urlsToCache);
//     })
//   );
// });//Activate the sw after install
// //Place where old caches are cleared
// self.addEventListener("activate", (event: any) => {
//   console.log("sw activate event");
//   event.waitUntil(
//     caches.keys().then((cacheNames) =>
//       Promise.all(
//         cacheNames
//           .filter((cacheName) => {
//             return cacheName.indexOf(version) !== 0;
//           })
//           .map(function (cachName) {
//             return caches.delete(cachName);
//           })
//       )
//     )
//   );
// });//listen for requests
// self.addEventListener("fetch", (event: any) => {
//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       return response || fetch(event.request);
//     })
//   );
// });

