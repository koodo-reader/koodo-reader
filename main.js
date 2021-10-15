const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
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

  ipcMain.on("open-book", (event, arg) => {
    let url = arg;

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
    if (url.indexOf("full") > -1) {
      Object.assign(options, {
        width: 1050,
        height: 660,
      });
      readerWindow = new BrowserWindow(options);
      readerWindow.loadURL(url.indexOf("pdf") > -1 ? pdfLocation : url);
      readerWindow.maximize();
    } else {
      Object.assign(options, {
        width: parseInt(urlParams.width),
        height: parseInt(urlParams.height),
        x: parseInt(urlParams.x),
        y: parseInt(urlParams.y),
        frame: urlParams.isMergeWord === "yes" ? false : true,
        hasShadow: urlParams.isMergeWord === "yes" ? false : true,
        transparent: urlParams.isMergeWord === "yes" ? true : false,
      });
      readerWindow = new BrowserWindow(options);
      readerWindow.loadURL(url.indexOf("pdf") > -1 ? pdfLocation : url);
    }
    readerWindow.on("close", () => {
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
  ipcMain.on("reader-bounds", (event, arg) => {
    if (readerWindow) {
      event.returnValue = readerWindow.getBounds();
    } else {
      event.returnValue = {};
    }
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
