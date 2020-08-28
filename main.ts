const { app, BrowserWindow, dialog, shell, remote } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
const fontList = require("font-list");
fontList
  .getFonts()
  .then((fonts: any[]) => {
    console.log(fonts);
  })
  .catch((err: any) => {
    console.log(err);
  });
let mainWindow;

app.on("ready", () => {
  // console.log("before message box");

  mainWindow = new BrowserWindow({
    width: 1030,
    height: 660,
    webPreferences: {
      nodeIntegration: false,
    },
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
