const { app, BrowserWindow } = require("electron");
const { ebtMain } = require("electron-baidu-tongji");
const path = require("path");
let mainWin;
let readerWindow;
const singleInstance = app.requestSingleInstanceLock();
var filePath = null;
if (process.platform == "win32" && process.argv.length >= 2) {
  filePath = process.argv[1];
}
// Single Instance Lock
if (!singleInstance) {
  app.quit();
} else {
  app.on("second-instance", (event, argv, workingDir) => {
    if (mainWin) {
      if (!mainWin.isVisible()) mainWin.show();
      mainWin.focus();
    }
  });
}
app.on("ready", () => {
  let option = {
    width: 1050,
    height: 660,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      nativeWindowOpen: true,
      enableRemoteModule: true,
      nodeIntegrationInSubFrames: true,
      allowRunningInsecureContent: true,
    },
    icon: path.join(__dirname, "assets", "icons", "256x256.png"),
  };

  mainWin = new BrowserWindow(option);
  const isDev = require("electron-is-dev");
  if (!isDev) {
    const { Menu } = require("electron");
    Menu.setApplicationMenu(null);
  }

  const urlLocation = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "./build/index.html")}`;

  mainWin.loadURL(urlLocation);
  const { remote, ipcMain } = require("electron");
  ebtMain(ipcMain, isDev);
  mainWin.on("close", () => {
    mainWin = null;
  });

  ipcMain.on("open-book", (event, arg) => {
    let url = arg;

    let options = {
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        nativeWindowOpen: true,
        enableRemoteModule: true,
        nodeIntegrationInSubFrames: true,
        allowRunningInsecureContent: true,
      },
      icon: path.join(__dirname, "assets", "icons", "256x256.png"),
    };

    let pdfLocation = isDev
      ? "http://localhost:3000/" + url
      : `file://${path.join(
          __dirname,
          "./build",
          "lib",
          "pdf",
          "web",
          "viewer.html"
        )}?${url.split("?")[1]}`;

    if (url.indexOf("full") > -1) {
      Object.assign(options, {
        width: 1050,
        height: 660,
      });
      readerWindow = new BrowserWindow(options);
      readerWindow.loadURL(url.indexOf("pdf") > -1 ? pdfLocation : url);
      readerWindow.maximize();
    } else {
      var urlParams;

      var match,
        pl = /\+/g,
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) {
          return decodeURIComponent(s.replace(pl, " "));
        },
        query = url.split("?").reverse()[0];
      urlParams = {};
      while ((match = search.exec(query)))
        urlParams[decode(match[1])] = decode(match[2]);
      Object.assign(options, {
        width: parseInt(urlParams.width),
        height: parseInt(urlParams.height),
        x: parseInt(urlParams.x),
        y: parseInt(urlParams.y),
      });
      readerWindow = new BrowserWindow(options);
      readerWindow.loadURL(url.indexOf("pdf") > -1 ? pdfLocation : url);
    }
    readerWindow.on("close", () => {
      readerWindow.destroy();
      readerWindow = null;
    });
    event.returnValue = "success";
  });
  ipcMain.handle("fonts-ready", async (event, arg) => {
    const fontList = require("font-list");
    const fonts = await fontList.getFonts({ disableQuoting: true });
    return fonts;
  });

  ipcMain.on("storage-location", (event, arg) => {
    const configDir = (app || remote.app).getPath("userData");
    const dirPath = path.join(configDir, "uploads");
    event.returnValue = path.join(dirPath, "data");
  });
  ipcMain.on("get-file-data", function (event) {
    event.returnValue = filePath;
    filePath = null;
  });
});
app.on("window-all-closed", () => {
  app.quit();
});
app.on("open-file", (e, pathToFile) => {
  filePath = pathToFile;
});
