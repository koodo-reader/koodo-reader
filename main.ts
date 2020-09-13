const {
  app,
  BrowserWindow,
  dialog,
  shell,
  remote,
  ipcMain,
} = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
const fontList = require("font-list");

let mainWin;
let splash;

app.on("ready", () => {
  mainWin = new BrowserWindow({
    titleBarStyle: "hidden",
    width: 1030,
    height: 660,
    webPreferences: { webSecurity: false, nodeIntegration: true },
    show: false,
  });
  splash = new BrowserWindow({
    width: 510,
    height: 323,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
  });
  splash.loadURL(
    isDev
      ? path.join(__dirname, "/assets/launch-page.html")
      : `file://${path.join(__dirname, "./assets/launch-page.html")}`
  );

  if (!isDev) {
    const { Menu } = require("electron");
    Menu.setApplicationMenu(null);
  }

  const urlLocation = isDev
    ? "http://localhost:3000/"
    : `file://${path.join(__dirname, "./build/index.html")}`;
  mainWin.loadURL(urlLocation);
  mainWin.once("ready-to-show", () => {
    splash.destroy();
    mainWin.show();
  });
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
});
app.on("window-all-closed", () => {
  app.quit();
});
