const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const Store = require("electron-store");
const store = new Store();
const fs = require("fs");
const configDir = app.getPath("userData");
const dirPath = path.join(configDir, "uploads");
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
  if (filePath) {
    fs.writeFileSync(
      path.join(dirPath, "log.json"),
      JSON.stringify({ filePath })
    );
  }
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
      contextIsolation: false,
      nativeWindowOpen: true,
      nodeIntegrationInSubFrames: true,
      allowRunningInsecureContent: true,
      enableRemoteModule: true,
    },
  };

  mainWin = new BrowserWindow(option);

  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  const urlLocation = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "./build/index.html")}`;

  mainWin.loadURL(urlLocation);

  mainWin.on("close", () => {
    mainWin = null;
  });

  ipcMain.handle("open-book", (event, config) => {
    let { url, isMergeWord, isFullscreen } = config;

    let options = {
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        contextIsolation: false,
        nativeWindowOpen: true,
        nodeIntegrationInSubFrames: true,
        allowRunningInsecureContent: true,
        enableRemoteModule: true,
      },
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

    if (isFullscreen === "yes") {
      Object.assign(options, {
        width: 1050,
        height: 660,
      });
      readerWindow = new BrowserWindow(options);
      readerWindow.loadURL(url.indexOf("pdf") > -1 ? pdfLocation : url);
      readerWindow.maximize();
    } else {
      Object.assign(options, {
        width: parseInt(store.get("windowWidth")),
        height: parseInt(store.get("windowHeight")),
        x: parseInt(store.get("windowX")),
        y: parseInt(store.get("windowY")),
        frame: isMergeWord === "yes" ? false : true,
        hasShadow: isMergeWord === "yes" ? false : true,
        transparent: isMergeWord === "yes" ? true : false,
      });
      readerWindow = new BrowserWindow(options);
      readerWindow.loadURL(url.indexOf("pdf") > -1 ? pdfLocation : url);
    }
    readerWindow.on("close", () => {
      let bounds = readerWindow.getBounds();
      store.set({
        windowWidth: bounds.width,
        windowHeight: bounds.height,
        windowX: bounds.x,
        windowY: bounds.y,
      });
      readerWindow && readerWindow.destroy();
      readerWindow = null;
    });

    event.returnValue = "success";
  });

  ipcMain.handle("change-path", async (event) => {
    var path = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    return path;
  });
  ipcMain.on("storage-location", (event, arg) => {
    event.returnValue = path.join(dirPath, "data");
  });
  ipcMain.on("user-data", (event, arg) => {
    event.returnValue = dirPath;
  });

  ipcMain.on("get-file-data", function (event) {
    if (fs.existsSync(path.join(dirPath, "log.json"))) {
      const _data = JSON.parse(
        fs.readFileSync(path.join(dirPath, "log.json"), "utf8") || "{}"
      );
      if (_data && _data.filePath) {
        filePath = _data.filePath;
        fs.writeFileSync(path.join(dirPath, "log.json"), "");
      }
    }

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
