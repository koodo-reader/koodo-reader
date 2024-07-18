const {
  app,
  BrowserWindow,
  BrowserView,
  Menu,
  ipcMain,
  dialog,
  powerSaveBlocker,
  nativeTheme,
} = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const Store = require("electron-store");
const store = new Store();
const fs = require("fs");
const configDir = app.getPath("userData");
const dirPath = path.join(configDir, "uploads");
let mainWin;
let readerWindow;
let mainView
const singleInstance = app.requestSingleInstanceLock();
var filePath = null;
if (process.platform != "darwin" && process.argv.length >= 2) {
  filePath = process.argv[1];
}
let options = {
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
const os = require('os');

if (os.platform() === 'linux') {
  options = Object.assign({}, options, {
    icon: path.join(__dirname, "./build/assets/icon.png"),
  });
}
// Single Instance Lock
if (!singleInstance) {
  app.quit();
  if (filePath) {
    fs.writeFileSync(
      path.join(dirPath, "log.json"),
      JSON.stringify({ filePath }),
      "utf-8"
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
const createMainWin = () => {
  mainWin = new BrowserWindow(options);

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
  mainWin.on("resize", () => {
    if (mainView) {
      let [width, height] = mainWin.getSize()
      mainView.setBounds({ x: 0, y: 0, width: width, height: height })
    }
  });
  mainWin.on("resize", () => {
    if (mainView) {
      let [width, height] = mainWin.getSize()
      mainView.setBounds({ x: 0, y: 0, width: width, height: height })
    }
  });
  mainWin.on("unmaximize", () => {
    if (mainView) {
      let [width, height] = mainWin.getSize()
      mainView.setBounds({ x: 0, y: 0, width: width, height: height })
    }
  });

  ipcMain.handle("open-book", (event, config) => {
    let { url, isMergeWord, isAutoFullscreen, isPreventSleep } = config;
    options.webPreferences.nodeIntegrationInSubFrames = true;
    store.set({
      url,
      isMergeWord: isMergeWord ? isMergeWord : "no",
      isAutoFullscreen: isAutoFullscreen ? isAutoFullscreen : "no",
      isPreventSleep: isPreventSleep ? isPreventSleep : "no",
    });
    let id;
    if (isPreventSleep === "yes") {
      id = powerSaveBlocker.start("prevent-display-sleep");
      console.log(powerSaveBlocker.isStarted(id));
    }

    if (isAutoFullscreen === "yes") {
      readerWindow = new BrowserWindow(options);
      readerWindow.loadURL(url);
      readerWindow.maximize();
    } else {
      readerWindow = new BrowserWindow({
        ...options,
        width: parseInt(store.get("windowWidth") || 1050),
        height: parseInt(store.get("windowHeight") || 660),
        x: parseInt(store.get("windowX")),
        y: parseInt(store.get("windowY")),
        frame: isMergeWord === "yes" ? false : true,
        hasShadow: isMergeWord === "yes" ? false : true,
        transparent: isMergeWord === "yes" ? true : false,
      });
      readerWindow.loadURL(url);
      // readerWindow.webContents.openDevTools();
    }
    readerWindow.on("close", (event) => {
      if (!readerWindow.isDestroyed()) {
        let bounds = readerWindow.getBounds();
        store.set({
          windowWidth: bounds.width,
          windowHeight: bounds.height,
          windowX: bounds.x,
          windowY: bounds.y,
        });
      }
      if (isPreventSleep && !readerWindow.isDestroyed()) {
        id && powerSaveBlocker.stop(id);
      }
      // readerWindow && readerWindow.destroy();
      // readerWindow = null;
    });


    event.returnValue = "success";
  });
  ipcMain.handle("generate-tts", async (event, voiceConfig) => {
    let { text, speed, plugin, config } = voiceConfig;
    let voiceFunc = plugin.script
    // eslint-disable-next-line no-eval
    eval(voiceFunc);
    return global.getAudioPath(text, speed, dirPath, config);

  });
  ipcMain.handle("ftp-upload", async (event, config) => {
    let { url, username, password, fileName, dir, ssl } = config;
    const Client = require("ftp");
    let c = new Client();
    async function uploadFile() {
      return new Promise((resolve, reject) => {
        c.on("ready", function () {
          c.put(
            path.join(dirPath, fileName),
            dir + "/" + fileName,
            function (err) {
              if (err) reject(err);
              c.end();
              resolve(true);
            }
          );
        });
        c.connect({
          host: url,
          user: username,
          password: password,
          secure: ssl === "1" ? true : false,
        });
      });
    }

    try {
      await uploadFile();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  });
  ipcMain.handle("ftp-download", async (event, config) => {
    let { url, username, password, fileName, dir, ssl } = config;
    const Client = require("ftp");
    let c = new Client();
    async function downloadFile() {
      return new Promise((resolve, reject) => {
        c.on("ready", function () {
          c.get(dir + "/" + fileName, function (err, stream) {
            if (err) reject(err);
            stream.once("close", function () {
              c.end();
              resolve(true);
            });
            stream.pipe(fs.createWriteStream(path.join(dirPath, fileName)));
          });
        });
        c.connect({
          host: url,
          user: username,
          password: password,
          secure: ssl === "1" ? true : false,
        });
      });
    }

    try {
      await downloadFile();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  });
  ipcMain.handle("sftp-upload", async (event, config) => {
    let { url, username, password, fileName, dir, port } = config;
    let Client = require("ssh2-sftp-client");
    let sftp = new Client();
    async function uploadFile() {
      return new Promise((resolve, reject) => {
        let data = fs.createReadStream(path.join(dirPath, fileName));
        let remote = "/" + dir + "/" + fileName;
        sftp
          .connect({
            host: url,
            port: port,
            username: username,
            password: password,
          })
          .then(() => {
            return sftp.put(data, remote);
          })
          .then(() => {
            resolve(true);
            return sftp.end();
          })
          .catch((err) => {
            console.error(err.message);
            resolve(false);
          });
      });
    }

    try {
      return await uploadFile();
    } catch (err) {
      console.error(err);
      return false;
    }
  });
  ipcMain.handle("webdav-download", async (event, config) => {
    let { url, username, password, fileName } = config;
    const { createClient } = require("webdav");
    async function downloadFile() {
      return new Promise(async (resolve, reject) => {
        const client = createClient(url, {
          username,
          password,
        });
        if ((await client.exists("/KoodoReader/data.zip")) === false) {
          resolve(false);
        }
        const buffer = await client.getFileContents("/KoodoReader/data.zip");
        fs.writeFileSync(path.join(dirPath, fileName), buffer);
        resolve(true);
      });
    }
    try {
      return await downloadFile();
    } catch (err) {
      console.error(err);
      return false;
    }
  });
  ipcMain.handle("webdav-upload", async (event, config) => {
    let { url, username, password, fileName } = config;
    const { createClient } = require("webdav");
    async function uploadFile() {
      return new Promise(async (resolve, reject) => {
        const client = createClient(url, {
          username,
          password,
        });
        if ((await client.exists("/KoodoReader")) === false) {
          await client.createDirectory("/KoodoReader");
        }
        let writeStream = client.createWriteStream("/KoodoReader/data.zip");
        fs.createReadStream(path.join(dirPath, fileName)).pipe(writeStream);
        writeStream.on("finish", () => {
          resolve(true);
        });
        writeStream.on("error", (err) => {
          console.log(error);
          resolve(false);
        });
      });
    }
    try {
      return await uploadFile();
    } catch (err) {
      console.error(err);
      return false;
    }
  });
  ipcMain.handle("sftp-download", async (event, config) => {
    let { url, username, password, fileName, dir, port } = config;
    let Client = require("ssh2-sftp-client");
    let sftp = new Client();
    async function downloadFile() {
      return new Promise((resolve, reject) => {
        let remotePath = "/" + dir + "/" + fileName;
        let dst = fs.createWriteStream(path.join(dirPath, fileName));
        sftp
          .connect({
            host: url,
            port: port,
            username: username,
            password: password,
          })
          .then(() => {
            return sftp.get(remotePath, dst);
          })
          .then(() => {
            resolve(true);
            return sftp.end();
          })
          .catch((err) => {
            console.error(err.message);
            resolve(false);
          });
      });
    }

    try {
      return await downloadFile();
    } catch (err) {
      console.error(err);
      return false;
    }
  });
  ipcMain.handle("s3-upload", async (event, config) => {
    const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
    let {
      endpoint,
      region,
      bucketName,
      accessKeyId,
      secretAccessKey,
      fileName,
    } = config;
    const s3 = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: fs.createReadStream(path.join(dirPath, fileName)),
        })
      );
      return true;
    } catch (err) {
      console.log("Error: ", err);
      return false;
    }
  });
  ipcMain.handle("s3-download", async (event, config) => {
    let {
      endpoint,
      region,
      bucketName,
      accessKeyId,
      secretAccessKey,
      fileName,
    } = config;
    const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
    function getObject(s3, bucket, key, writable) {
      return new Promise(async (resolve, reject) => {
        const getObjectCommandOutput = await s3.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        );
        if (getObjectCommandOutput.Body) {
          getObjectCommandOutput.Body.pipe(writable);
          writable.on("finish", (err) => {
            if (err) reject(false);
            resolve(true);
          });
        } else {
          reject(false);
        }
      });
    }
    async function downloadFile() {
      return new Promise((resolve, reject) => {
        const s3 = new S3Client({
          region,
          endpoint,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        let writeStream = fs.createWriteStream(path.join(dirPath, fileName));
        getObject(s3, bucketName, fileName, writeStream)
          .then((data) => {
            resolve(true);
          })
          .catch((err) => {
            console.error(err);
            resolve(false);
          });
      });
    }
    try {
      return await downloadFile();
    } catch (err) {
      console.error(err);
      return false;
    }
  });
  ipcMain.handle("clear-tts", async (event, config) => {
    if (!fs.existsSync(path.join(dirPath, "tts"))) {
      return "pong";
    } else {
      const fsExtra = require("fs-extra");
      try {
        await fsExtra.remove(path.join(dirPath, "tts"));
        await fsExtra.mkdir(path.join(dirPath, "tts"));
        console.log("success!");
        return "pong";
      } catch (err) {
        console.error(err);
        return "pong";
      }
    }
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
  ipcMain.handle("hide-reader", (event, arg) => {
    if (readerWindow && readerWindow.isFocused()) {
      readerWindow.minimize();
      event.returnvalue = true;
    } else if (mainWin && mainWin.isFocused()) {
      mainWin.minimize();
      event.returnvalue = true;
    } else {
      event.returnvalue = false;
    }
  });
  ipcMain.handle("open-console", (event, arg) => {
    mainWin.webContents.openDevTools();
    event.returnvalue = true;
  });
  ipcMain.handle("reload-reader", (event, arg) => {
    if (readerWindow) {
      readerWindow.reload();
    }
  });
  ipcMain.handle("reload-main", (event, arg) => {
    if (mainWin) {
      mainWin.reload();
    }
  });
  ipcMain.handle("focus-on-main", (event, arg) => {
    if (mainWin) {
      if (!mainWin.isVisible()) mainWin.show();
      mainWin.focus();
    }
  });
  ipcMain.handle("create-new-main", (event, arg) => {
    if (!mainWin) {
      createMainWin();
    }
  });
  ipcMain.handle("new-tab", (event, config) => {
    if (mainWin) {
      mainView = new BrowserView(options)
      mainWin.setBrowserView(mainView)
      let [width, height] = mainWin.getSize()
      mainView.setBounds({ x: 0, y: 0, width: width, height: height })
      console.log(config.url);
      mainView.webContents.loadURL(config.url)
    }
  });
  ipcMain.handle("reload-tab", (event, config) => {
    if (mainWin && mainView) {
      mainView.webContents.reload()
    }
  });
  ipcMain.handle("adjust-tab-size", (event, config) => {
    if (mainWin && mainView) {
      let [width, height] = mainWin.getSize()
      mainView.setBounds({ x: 0, y: 0, width: width, height: height })
    }
  });
  ipcMain.handle("exit-tab", (event, message) => {
    if (mainWin && mainView) {
      mainWin.setBrowserView(null)
    }
  });
  ipcMain.handle("enter-tab-fullscreen", () => {
    if (mainWin && mainView) {
      mainWin.setFullScreen(true);
      console.log("enter full");
    }
  });
  ipcMain.handle("exit-tab-fullscreen", () => {
    if (mainWin && mainView) {
      mainWin.setFullScreen(false);
      console.log("exit full");
    }
  });
  ipcMain.handle("enter-fullscreen", () => {
    if (readerWindow) {
      readerWindow.setFullScreen(true);
      console.log("enter full");
    }
  });
  ipcMain.handle("exit-fullscreen", () => {
    if (readerWindow) {
      readerWindow.setFullScreen(false);
      console.log("exit full");
    }
  });
  ipcMain.handle("switch-moyu", (event, arg) => {
    let id;
    if (store.get("isPreventSleep") === "yes") {
      id = powerSaveBlocker.start("prevent-display-sleep");
      console.log(powerSaveBlocker.isStarted(id));
    }
    if (readerWindow) {
      readerWindow.close();
      Object.assign(options, {
        width: parseInt(store.get("windowWidth") || 1050),
        height: parseInt(store.get("windowHeight") || 660),
        x: parseInt(store.get("windowX")),
        y: parseInt(store.get("windowY")),
        frame: store.get("isMergeWord") !== "yes" ? false : true,
        hasShadow: store.get("isMergeWord") !== "yes" ? false : true,
        transparent: store.get("isMergeWord") !== "yes" ? true : false,
      });
      options.webPreferences.nodeIntegrationInSubFrames = true;

      store.set(
        "isMergeWord",
        store.get("isMergeWord") !== "yes" ? "yes" : "no"
      );
      readerWindow = new BrowserWindow(options);
      readerWindow.loadURL(store.get("url"));
      readerWindow.on("close", (event) => {
        if (!readerWindow.isDestroyed()) {
          let bounds = readerWindow.getBounds();
          store.set({
            windowWidth: bounds.width,
            windowHeight: bounds.height,
            windowX: bounds.x,
            windowY: bounds.y,
          });
        }
        if (store.get("isPreventSleep") && !readerWindow.isDestroyed()) {
          id && powerSaveBlocker.stop(id);
        }
        // readerWindow && readerWindow.destroy();
        // readerWindow = null;
      });
    }
    event.returnvalue = false;
  });
  ipcMain.on("get-dirname", (event, arg) => {
    event.returnValue = __dirname;
  });
  ipcMain.on("system-color", (event, arg) => {
    event.returnValue = nativeTheme.shouldUseDarkColors || false;
  });
  ipcMain.on("check-main-open", (event, arg) => {
    event.returnValue = mainWin ? true : false;
  });
  ipcMain.on("get-file-data", function (event) {
    if (fs.existsSync(path.join(dirPath, "log.json"))) {
      const _data = JSON.parse(
        fs.readFileSync(path.join(dirPath, "log.json"), "utf-8") || "{}"
      );
      if (_data && _data.filePath) {
        filePath = _data.filePath;
        fs.writeFileSync(path.join(dirPath, "log.json"), "", "utf-8");
      }
    }

    event.returnValue = filePath;
    filePath = null;
  });
};
app.on("ready", () => {
  createMainWin();
});
app.on("window-all-closed", () => {
  app.quit();
});
app.on("open-file", (e, pathToFile) => {
  filePath = pathToFile;
});
