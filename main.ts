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
// const Elp = require("electron-launch-page");

app.on("ready", () => {
  let mainWin = new BrowserWindow({
    width: 1030,
    height: 660,
    webPreferences: { webSecurity: false, nodeIntegration: true },
    // show: false,
    // transparent: true,
  });
  // Elp.main.start({
  //   //主窗口 BrowserWindow
  //   mainWin,
  //   //自定义的启动页
  //   launchUrl: path.join(__dirname, "launch-page.html"),
  //   //启动窗口大小，根据 your-launch.html 配置
  //   transparent: true,
  //   width: 480,
  //   height: 320,
  // });
  if (!isDev) {
    const { Menu } = require("electron");
    Menu.setApplicationMenu(null);
  }

  const urlLocation = isDev
    ? "http://localhost:3000/"
    : `file://${path.join(__dirname, "./build/index.html")}`;
  mainWin.loadURL(urlLocation);
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
