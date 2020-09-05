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
// ipcMain.on("is-fonts-ready", (event, arg) => {
//   console.log(arg, "arg");

// });
ipcMain.on("fonts-ready", (event, arg) => {
  console.log(arg); // prints "ping"
  fontList
    .getFonts()
    .then((fonts) => {
      event.returnValue = fonts;
      // event.reply("fonts-ready", "pong");
    })
    .catch((err) => {
      console.log("epub");
    });
});

let mainWindow;

app.on("ready", () => {
  // console.log("before message box");

  mainWindow = new BrowserWindow({
    width: 1030,
    height: 660,
    webPreferences: { webSecurity: false, nodeIntegration: true },
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
