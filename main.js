const { remote, app, BrowserWindow, ipcMain, screen } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
let mainWin;
app.disableHardwareAcceleration();
const configDir = (app || remote.app).getPath("userData");
const dirPath = path.join(configDir, "uploads");

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
        Object.assign(options, {
          // parent: mainWin,
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
    var data = null;
    if (process.platform == "win32" && process.argv.length >= 2) {
      var openFilePath = process.argv[1];
      data = openFilePath;
    }
    event.returnValue = data;
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
app.on("second-instance", () => {
  if (mainWin) {
    if (mainWin.isMinimized()) {
      mainWin.restore();
    }
    mainWin.show(); // focuses as well
  }
});
