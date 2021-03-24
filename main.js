const { remote, app, BrowserWindow, ipcMain, screen } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
let mainWin;
app.disableHardwareAcceleration();
const configDir = (app || remote.app).getPath("userData");
const dirPath = path.join(configDir, "uploads");
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
    console.log(event, argv, workingDir);
    if (mainWin) {
      if (!mainWin.isVisible()) mainWin.show();
      mainWin.focus();
      event.sender.send("open-book", filePath);
      filePath = null;
    }
  });
}

app.on("ready", () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWin = new BrowserWindow({
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
  });
  if (!isDev) {
    const { Menu } = require("electron");
    Menu.setApplicationMenu(null);
  }

  const urlLocation = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "./build/index.html")}`;
  mainWin.loadURL(urlLocation);
  mainWin.webContents.on(
    "new-window",
    (event, url, frameName, disposition, options, additionalFeatures) => {
      event.preventDefault();
      if (url.indexOf("full") > -1) {
        console.log("full");
        Object.assign(options, {
          parent: mainWin,
          width: width,
          height: height,
        });
        event.newGuest = new BrowserWindow(options);
        event.newGuest.maximize();
      } else {
        var urlParams;

        var match,
          pl = /\+/g, // Regex for replacing addition symbol with a space
          search = /([^&=]+)=?([^&]*)/g,
          decode = function (s) {
            return decodeURIComponent(s.replace(pl, " "));
          },
          query = url.split("?").reverse()[0];

        urlParams = {};
        while ((match = search.exec(query)))
          urlParams[decode(match[1])] = decode(match[2]);
        Object.assign(options, {
          parent: mainWin,
          width: parseInt(urlParams.width),
          height: parseInt(urlParams.height),
          x: parseInt(urlParams.x),
          y: parseInt(urlParams.y),
        });
        event.newGuest = new BrowserWindow(options);
      }
      mainWin.hide();
      event.newGuest.on("close", () => {
        mainWin.show();
        event.newGuest = null;
      });
    }
  );
  mainWin.on("close", () => {
    mainWin = null;
  });

  ipcMain.on("fonts-ready", (event, arg) => {
    const fontList = require("font-list");
    fontList
      .getFonts()
      .then((fonts) => {
        event.returnValue = fonts;
      })
      .catch((err) => {
        console.log(err);
      });
  });
  ipcMain.on("storage-location", (event, arg) => {
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
