const { app, BrowserWindow, ipcMain, screen, dialog } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
const fontList = require("font-list");
const detect = require("detect-port");
const { startExpress } = require("./server");
let mainWin;
let splash;
app.disableHardwareAcceleration();
const port = 3366;

app.on("ready", () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  detect(port, (err, _port) => {
    if (port == _port) {
      console.log("port is availible");
      mainWin = new BrowserWindow({
        titleBarStyle: "hidden",
        width: 1030,
        height: 660,
        webPreferences: {
          webSecurity: false,
          nodeIntegration: true,
          nativeWindowOpen: true,
          nodeIntegrationInSubFrames: true,
          allowRunningInsecureContent: true,
        },
        show: false,
        // transparent: true,
      });
      splash = new BrowserWindow({
        width: 530,
        height: 343,
        frame: false,
        transparent: true,
        alwaysOnTop: isDev ? false : true,
      });
      splash.loadURL(
        isDev
          ? path.join(__dirname, "/public/assets/launch-page.html")
          : `file://${path.join(__dirname, "./build/assets/launch-page.html")}`
      );
      if (!isDev) {
        const { Menu } = require("electron");
        Menu.setApplicationMenu(null);
      }

      const urlLocation = isDev
        ? "http://localhost:3000"
        : `file://${path.join(__dirname, "./build/index.html")}`;
      mainWin.loadURL(urlLocation);
      mainWin.webContents.on("did-finish-load", () => {
        splash.destroy();
        // mainWin.maximize();
        // mainWin.webContents.setZoomFactor(1);
        mainWin.show();
      });
      mainWin.webContents.on(
        "new-window",
        (event, url, frameName, disposition, options, additionalFeatures) => {
          event.preventDefault();
          Object.assign(options, {
            parent: mainWin,
            width: width,
            height: height,
          });
          event.newGuest = new BrowserWindow(options);
          event.newGuest.maximize();
        }
      );
      mainWin.on("close", () => {
        mainWin = null;
      });
      ipcMain.on("fonts-ready", (event, arg) => {
        fontList
          .getFonts()
          .then((fonts) => {
            event.returnValue = fonts;
          })
          .catch((err) => {
            console.log(err);
          });
      });
      ipcMain.on("start-server", (event, arg) => {
        startExpress();
        event.returnValue = "pong";
      });
      ipcMain.on("get-file-data", function (event) {
        var data = null;
        if (process.platform == "win32" && process.argv.length >= 2) {
          var openFilePath = process.argv[1];
          data = openFilePath;
        }
        event.returnValue = data;
      });
    } else {
      dialog.showMessageBox({
        type: "warning",
        title: "Warning",
        message: "Another Koodo Reader is already running",
      });
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
