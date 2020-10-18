const { app, BrowserWindow, ipcMain, screen } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
const fontList = require("font-list");

let mainWin;
let splash;

app.disableHardwareAcceleration();
app.on("ready", () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWin = new BrowserWindow({
    titleBarStyle: "hidden",
    width: 1030,
    height: 660,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      nativeWindowOpen: true,
      nodeIntegrationInSubFrames: true,
    },
    show: false,
    // transparent: true,
  });
  splash = new BrowserWindow({
    width: 530,
    height: 343,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
  });
  splash.loadURL(
    isDev
      ? path.join(__dirname, "/public/assets/launch-page.html")
      : `file://${path.join(__dirname, "./build/assets/launch-page.html")}`
  );
  // if (!isDev) {
  //   const { Menu } = require("electron");
  //   Menu.setApplicationMenu(null);
  // }

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
  mainWin.on("close", () => {
    mainWin = null;
  });
  mainWin.webContents.on(
    "new-window",
    (event, url, frameName, disposition, options, additionalFeatures) => {
      event.preventDefault();
      Object.assign(options, {
        parent: mainWin,
        width: width,
        height: height,
        frame: url.indexOf("epub") > -1 ? true : true,
      });
      event.newGuest = new BrowserWindow(options);
      event.newGuest.maximize();
    }
  );
  ipcMain.on("fonts-ready", (event, arg) => {
    fontList
      .getFonts()
      .then((fonts) => {
        event.returnValue = fonts;

        const server = require("./server");
      })
      .catch((err) => {
        console.log(err);
      });
  });
});
app.on("window-all-closed", () => {
  app.quit();
});
