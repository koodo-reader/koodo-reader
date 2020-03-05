const { app, BrowserWindow, dialog, shell, remote } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
const { autoUpdater } = require("electron-updater");
let mainWindow;

app.on("ready", () => {
  console.log("before message box");

  // const options = {
  //   type: "question",s
  //   buttons: ["Cancel", "Yes, please", "No, thanks"],
  //   defaultId: 2,
  //   title: "Question",
  //   message: "Do you want to do this?",
  //   detail: "It does not really matter",
  //   checkboxLabel: "Remember my answer",
  //   checkboxChecked: true
  // };

  // dialog.showMessageBox(null, options, (response, checkboxChecked) => {
  //   console.log(response);
  //   console.log(checkboxChecked);
  // });
  // if (isDev) {
  //   autoUpdater.updateConfigPath = path.join(__dirname, "dev-app-update.yml");
  // }
  // autoUpdater.autoDownload = false;
  // autoUpdater.checkForUpdates();
  // // autoUpdater.on("error", error => {
  // //   dialog.showErrorBox("Error= ",error===null?'unknown':);
  // // });
  // dialog.showMessageBox(
  //   {
  //     type: "info",
  //     title: "更新提示",
  //     message: "可道阅读器发布新版本啦！",
  //     buttons: ["前往下载", "稍后提醒"]
  //   },
  //   index => {
  //     if (index === 0) {
  //       console.log("hello");
  //       shell.openExternal("http://koodo.102410.xyz/download");
  //     } else {
  //       console.log("object");
  //     }
  //   }
  // );
  autoUpdater.on("update-available", () => {
    dialog
      .showMessageBox({
        title:"更新提示"
        message: "可道阅读器发布新版本啦！",
        buttons: ["前往下载", "稍后提醒"],
        defaultId: 0, // bound to buttons array
        cancelId: 1 // bound to buttons array
      })
      .then(result => {
        if (result.response === 0) {
          // bound to buttons array
          shell.openExternal("https://koodo.102410.xyz/download");
        } else if (result.response === 1) {
          // bound to buttons array
          console.log("Cancel button clicked.");
        }
      });
    console.log("after message box");
  });
  // autoUpdater.on("update-not-available", () => {
  //   dialog.showMessageBox({
  //     title: "没有新版本",
  //     message: "当前已经是最新版本"
  //   });
  // });
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 660,
    webPreferences: {
      nodeIntegration: false
    }
  });
  if (!isDev) {
    const { Menu } = require("electron");
    Menu.setApplicationMenu(null);
  }

  const urlLocation = isDev
    ? "http://localhost:3000/"
    : `file://${path.join(__dirname, "./build/index.html")}`;
  mainWindow.loadURL(urlLocation);
});
