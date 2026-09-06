const {
  app,
  BrowserWindow,
  WebContentsView,
  Menu,
  Tray,
  nativeImage,
  ipcMain,
  dialog,
  powerSaveBlocker,
  nativeTheme: electronNativeTheme,
  screen,
  shell,
  clipboard,
  net,
  session,
} = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");
const isDev = require("electron-is-dev");
const Store = require("electron-store");
const log = require("electron-log/main");
const os = require("os");
const store = new Store();
const fs = require("fs");
const fsExtra = require("fs-extra");
const nodeCrypto = require("crypto");
const yauzl = require("yauzl");
const tarStream = require("tar-stream");
const {
  normalizeArchiveEntryName,
  ensureEntryInside,
  ensureTarIndex,
  extractTarByOffsets,
} = require("./src/utils/main/tar-index");
const { runPowerShellScript } = require("./src/utils/main/powershell-util");
const {
  buildProxyUrl,
  checkCloudUrl,
  testProxyConnection,
} = require("./src/utils/main/network-util");
const { backupToPath, restoreFromPath } = require(
  "./src/utils/main/backup-util"
);
const {
  setDiscordActivity,
  clearDiscordActivity,
  destroyDiscordRPC,
} = require("./src/utils/main/discord-rpc-util");
const {
  resolveOcrLang,
  parseOcrImageInput,
  writeOcrTempImage,
  runWindowsOcr,
  runMacosOcr,
} = require("./src/utils/main/ocr-util");
const {
  getBiometricCapability,
  promptBiometricAuth,
} = require("./src/utils/main/biometric-util");
const { getVoicePlugin } = require("./src/utils/plugins/main/registry");
const configDir = app.getPath("userData");
const dirPath = path.join(configDir, "uploads");
const packageJson = require("./package.json");
let mainWin;
let tray = null;
let isQuitting = false;
let readerWindow;
let readerWindowList = [];
let dictWindow;
let transWindow;
let linkWindow;
let mainView;
//multi tab
// let mainViewList = []
let readerWindowReadyToClose = false;
let chatWindow;
let dbConnection = {};
let syncUtilCache = {};
let pickerUtilCache = {};
let downloadRequest = null;

const RESIZE_THROTTLE_MS = 300;

const throttle = (func, wait = RESIZE_THROTTLE_MS) => {
  let lastCall = 0;
  let timeoutId = null;
  return function (...args) {
    const now = Date.now();
    const invoke = () => {
      lastCall = Date.now();
      func.apply(this, args);
    };
    if (now - lastCall >= wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      invoke();
    } else if (!timeoutId) {
      timeoutId = setTimeout(
        () => {
          timeoutId = null;
          invoke();
        },
        wait - (now - lastCall)
      );
    }
  };
};
const getFingerprint = async () => {
  // First, try to get cached fingerprint
  let deviceUuid = store.get("fingerPrint");
  if (deviceUuid) {
    return deviceUuid;
  }

  // Try to get machine ID with additional error handling
  try {
    const { machineIdSync } = require("node-machine-id");
    let machineId = machineIdSync();
    if (machineId && typeof machineId === "string" && machineId.length > 0) {
      // Cache the machine ID for future use
      store.set("fingerPrint", machineId);
      return machineId;
    }
  } catch (error) {
    console.error("Failed to get machine ID:", error);
  }

  // Fallback: generate and cache a UUID
  let fingerprint = uuidv4().replace(/-/g, "");
  store.set("fingerPrint", fingerprint);
  return fingerprint;
};

const loadUrlInAuxWindow = async (win, url) => {
  const wc = win.webContents;
  let currentUrl = "";
  try {
    currentUrl = wc.getURL();
  } catch (_) {
    currentUrl = "";
  }
  if (currentUrl === url) {
    wc.reload();
    return;
  }
  let needBlankIntermediate = false;
  try {
    const current = new URL(currentUrl);
    const next = new URL(url);
    // When only the hash differs, Chromium treats it as a same-page hashchange
    // and won't reload the page. Navigating through about:blank forces a full reload.
    needBlankIntermediate =
      current.origin === next.origin &&
      current.pathname === next.pathname &&
      current.search === next.search;
  } catch (_) {
    // ignore invalid URLs (e.g. empty string, about:blank)
  }
  if (needBlankIntermediate) {
    await wc.loadURL("about:blank");
  }
  await wc.loadURL(url);
};

const singleInstance = app.requestSingleInstanceLock();
var filePath = null;
var pendingDeepLink = null;
if (process.platform != "darwin" && process.argv.length >= 2) {
  filePath = process.argv[1];
  // Check argv for a deep link URL (cold start)
  for (const arg of process.argv) {
    if (arg.startsWith("koodo-reader://")) {
      pendingDeepLink = arg;
      break;
    }
  }
}
log.transports.file.fileName = "debug.log";
log.transports.file.maxSize = 1024 * 1024; // 1MB
log.initialize();
store.set("appVersion", packageJson.version);
store.set("appPlatform", os.platform() + " " + os.release());
const mainWinDisplayScale = store.get("mainWinDisplayScale") || 1;
let options = {
  width: parseInt(store.get("mainWinWidth") || 1050) / mainWinDisplayScale,
  height: parseInt(store.get("mainWinHeight") || 660) / mainWinDisplayScale,
  x: parseInt(store.get("mainWinX")),
  y: parseInt(store.get("mainWinY")),
  backgroundColor:
    store.get("appSkin") === "night" ? "rgba(47, 52, 55, 1)" : "#fff",
  minWidth: 300,
  minHeight: 100,
  webPreferences: {
    webSecurity: !isDev,
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, "preload.js"),
    nativeWindowOpen: true,
    nodeIntegrationInSubFrames: false,
    allowRunningInsecureContent: false,
    enableRemoteModule: false,
    sandbox: true,
  },
};
const Database = require("better-sqlite3");
if (os.platform() === "linux") {
  options = Object.assign({}, options, {
    icon: path.join(__dirname, "./build/assets/icon.png"),
  });
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
    // Handle deep link passed via second-instance argv
    const deepLink = argv.find((arg) => arg.startsWith("koodo-reader://"));
    if (deepLink) {
      handleCallback(deepLink);
    }
  });
}
if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
  // Make sure the directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(
    path.join(dirPath, "log.json"),
    JSON.stringify({ filePath }),
    "utf-8"
  );
}
const getDBConnection = (dbName, storagePath, sqlStatement) => {
  if (!dbConnection[dbName]) {
    if (!fs.existsSync(path.join(storagePath, "config"))) {
      fs.mkdirSync(path.join(storagePath, "config"), { recursive: true });
    }
    dbConnection[dbName] = new Database(
      path.join(storagePath, "config", `${dbName}.db`),
      {}
    );
    dbConnection[dbName].pragma("journal_mode = WAL");
    dbConnection[dbName].exec(sqlStatement["createTableStatement"][dbName]);
    if (sqlStatement["migrateStatement"][dbName]) {
      let sqlList = sqlStatement["migrateStatement"][dbName];
      for (let sql of sqlList) {
        try {
          dbConnection[dbName].exec(sql);
        } catch (error) {}
      }
    }
  }
  return dbConnection[dbName];
};
const getSyncUtil = async (config, isUseCache = true) => {
  if (!isUseCache || !syncUtilCache[config.service]) {
    const { SyncUtil } = await import("./src/assets/lib/kookit-extra.min.mjs");
    syncUtilCache[config.service] = new SyncUtil(config.service, config);
  }
  return syncUtilCache[config.service];
};
const removeSyncUtil = (config) => {
  if (syncUtilCache[config.service]) {
    syncUtilCache[config.service].clearQueue();
    delete syncUtilCache[config.service];
  }
};
const getPickerUtil = async (config, isUseCache = true) => {
  if (!isUseCache || !pickerUtilCache[config.service]) {
    const { SyncUtil } = await import("./src/assets/lib/kookit-extra.min.mjs");
    pickerUtilCache[config.service] = new SyncUtil(config.service, config);
  }
  return pickerUtilCache[config.service];
};
const removePickerUtil = (config) => {
  if (pickerUtilCache[config.service]) {
    pickerUtilCache[config.service] = null;
  }
};
const getNativeThemeSource = (appSkin) => {
  if (appSkin === "night") {
    return "dark";
  }
  if (appSkin === "light") {
    return "light";
  }
  return "system";
};
const getNativeDarkColorStatus = () => {
  if (
    typeof electronNativeTheme.shouldUseDarkColorsForSystemIntegratedUI !==
    "undefined"
  ) {
    return electronNativeTheme.shouldUseDarkColorsForSystemIntegratedUI;
  }
  return electronNativeTheme.shouldUseDarkColors;
};
const applyNativeThemeSource = (appSkin) => {
  if (process.type !== "browser") {
    return false;
  }
  electronNativeTheme.themeSource = getNativeThemeSource(appSkin);
  store.set("appSkin", appSkin || "system");
  return getNativeDarkColorStatus();
};
applyNativeThemeSource(store.get("appSkin"));
const applyProxyToSession = async () => {
  const { session } = require("electron");
  const http = require("http");
  const https = require("https");
  const config = store.get("proxyConfig");
  const defaultSession = session.defaultSession;
  const isEnabled =
    config && config.type !== "none" && config.enabled !== false && config.host;
  if (!isEnabled) {
    await defaultSession.setProxy({ mode: "direct" });
    https.globalAgent = new https.Agent();
    http.globalAgent = new http.Agent();
    return;
  }
  const proxyUrl = buildProxyUrl(config);
  let agent = null;
  try {
    if (config.type === "socks5") {
      const { SocksProxyAgent } = require("socks-proxy-agent");
      agent = new SocksProxyAgent(proxyUrl);
    } else {
      const { HttpsProxyAgent } = require("https-proxy-agent");
      agent = new HttpsProxyAgent(proxyUrl);
    }
  } catch (error) {
    agent = null;
  }
  const authentication = config.username
    ? `${encodeURIComponent(config.username)}:${encodeURIComponent(config.password || "")}@`
    : "";
  if (config.type === "http") {
    const proxyAddress = `${authentication}${config.host}:${config.port}`;
    await defaultSession.setProxy({
      proxyRules: `http=${proxyAddress};https=${proxyAddress}`,
    });
  } else if (config.type === "socks5") {
    await defaultSession.setProxy({
      proxyRules: `socks5://${config.host}:${config.port}`,
    });
  }
  if (agent) {
    https.globalAgent = agent;
    http.globalAgent = agent;
  }
};
// Simple encryption function
const encrypt = (text, key) => {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return Buffer.from(result).toString("base64");
};

// Simple decryption function
const decrypt = (encryptedText, key) => {
  const buff = Buffer.from(encryptedText, "base64").toString();
  let result = "";
  for (let i = 0; i < buff.length; i++) {
    const charCode = buff.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
};
// Helper to check if two rectangles intersect (for partial visibility)
const rectanglesIntersect = (rect1, rect2) => {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect1.y + rect1.height <= rect2.y ||
    rect1.x >= rect2.x + rect2.width ||
    rect1.y >= rect2.y + rect2.height
  );
};

// Check if the window is at least partially visible on any display
const isWindowPartiallyVisible = (bounds) => {
  const displays = screen.getAllDisplays();
  for (const display of displays) {
    if (rectanglesIntersect(bounds, display.workArea)) {
      return true;
    }
  }
  return false;
};
const createTray = () => {
  let iconPath = isDev
    ? path.join(__dirname, "./public/assets/icon.png")
    : path.join(__dirname, "./build/assets/icon.png");
  let trayIcon = nativeImage.createFromPath(iconPath);
  if (os.platform() === "darwin") {
    trayIcon = trayIcon.resize({ width: 16, height: 16, quality: "best" });
    trayIcon.setTemplateImage(false);
  }
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Koodo Reader",
      click: () => {
        if (mainWin) {
          mainWin.show();
          mainWin.focus();
        }
      },
    },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip("Koodo Reader");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (mainWin) {
      mainWin.show();
      mainWin.focus();
    }
  });
};
const createMainWin = () => {
  const isMainWindVisible = isWindowPartiallyVisible({
    width: parseInt(store.get("mainWinWidth") || 1050) / mainWinDisplayScale,
    height: parseInt(store.get("mainWinHeight") || 660) / mainWinDisplayScale,
    x: parseInt(store.get("mainWinX")),
    y: parseInt(store.get("mainWinY")),
  });
  if (!isMainWindVisible) {
    delete options.x;
    delete options.y;
  }
  mainWin = new BrowserWindow(options);
  if (store.get("isAlwaysOnTop") === "yes") {
    mainWin.setAlwaysOnTop(true);
  }
  if (store.get("isAutoMaximizeWin") === "yes") {
    mainWin.maximize();
  }

  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  const urlLocation = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "./build/index.html")}`;
  mainWin.loadURL(urlLocation);
  // Handle deep link on cold start: wait for renderer to mount its IPC listeners
  mainWin.webContents.once("did-finish-load", () => {
    if (pendingDeepLink) {
      const link = pendingDeepLink;
      pendingDeepLink = null;
      // Give React time to register ipcRenderer listeners before dispatching
      setTimeout(() => handleCallback(link), 1500);
    }
  });
  mainWin.on("close", (event) => {
    if (!isQuitting && store.get("isMinimizeToTray") === "yes") {
      event.preventDefault();
      mainWin.hide();
      if (!tray) {
        createTray();
      }
      return;
    }
    if (mainWin && !mainWin.isDestroyed()) {
      let bounds = mainWin.getBounds();
      const currentDisplay = screen.getDisplayMatching(bounds);
      const primaryDisplay = screen.getPrimaryDisplay();
      if (bounds.width > 300 && bounds.height > 100) {
        store.set({
          mainWinWidth: bounds.width,
          mainWinHeight: bounds.height,
          mainWinX: mainWin.isMaximized() ? 0 : bounds.x,
          mainWinY: mainWin.isMaximized() ? 0 : bounds.y,
          mainWinDisplayScale:
            currentDisplay.scaleFactor / primaryDisplay.scaleFactor,
        });
      }
    }
    mainWin = null;
  });
  const syncMainViewBounds = () => {
    if (mainView) {
      if (!mainWin) return;
      let { width, height } = mainWin.getContentBounds();
      mainView.setBounds({ x: 0, y: 0, width: width, height: height });
    }
  };
  mainWin.on("resize", throttle(syncMainViewBounds));
  mainWin.on("maximize", () => {
    if (mainView) {
      let { width, height } = mainWin.getContentBounds();
      mainView.setBounds({ x: 0, y: 0, width: width, height: height });
    }
  });
  mainWin.on("unmaximize", () => {
    if (mainView) {
      let { width, height } = mainWin.getContentBounds();
      mainView.setBounds({ x: 0, y: 0, width: width, height: height });
    }
  });
  mainWin.on("focus", () => {
    if (mainView && !mainView.webContents.isDestroyed()) {
      mainView.webContents.focus();
    }
  });
  mainWin.webContents.on("console-message", (_event, level, message) => {
    const lvl =
      { 0: "info", 1: "info", 2: "warn", 3: "error" }[level] || "info";
    log[lvl](`[Renderer] ${message}`);
  });
  //cancel-download-app
  const normalizeFileData = (value) => {
    if (value instanceof Uint8Array) return Buffer.from(value);
    if (value instanceof ArrayBuffer) return Buffer.from(value);
    if (ArrayBuffer.isView(value)) {
      return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    }
    return value;
  };
  const runFileCommand = (args) => {
    if (!args || typeof args.operation !== "string") {
      throw new TypeError("Invalid file operation");
    }
    const operation = args.operation;
    const filePath = args.path === undefined ? undefined : args.path;
    switch (operation) {
      case "exists":
        return fs.existsSync(filePath);
      case "mkdir":
        return fs.mkdirSync(filePath, args.options || {});
      case "read":
        return fs.readFileSync(filePath, args.options);
      case "write":
        return fs.writeFileSync(
          filePath,
          normalizeFileData(args.data),
          args.options
        );
      case "append":
        return fs.appendFileSync(
          filePath,
          normalizeFileData(args.data),
          args.options
        );
      case "readdir": {
        const entries = fs.readdirSync(filePath, args.options || {});
        return args.options && args.options.withFileTypes
          ? entries.map((entry) => ({
              name: entry.name,
              isFile: entry.isFile(),
              isDirectory: entry.isDirectory(),
            }))
          : entries;
      }
      case "stat": {
        const stat = fs.statSync(filePath);
        return {
          size: stat.size,
          mtimeMs: stat.mtimeMs,
          isFile: stat.isFile(),
          isDirectory: stat.isDirectory(),
        };
      }
      case "unlink":
        return fs.unlinkSync(filePath);
      case "copyFile":
        return fs.copyFileSync(args.source, args.destination);
      case "rename":
        return fs.renameSync(args.source, args.destination);
      case "rm":
        return fs.rmSync(filePath, args.options || {});
      case "emptyDir":
        return fsExtra.emptyDirSync(filePath);
      case "copy":
        return fsExtra.copy(args.source, args.destination);
      default:
        throw new Error(`Unsupported file operation: ${operation}`);
    }
  };
  ipcMain.on("file-command-sync", (event, args) => {
    try {
      event.returnValue = { ok: true, value: runFileCommand(args) };
    } catch (error) {
      event.returnValue = {
        ok: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code:
            error && typeof error.code === "string" ? error.code : undefined,
        },
      };
    }
  });
  ipcMain.handle("file-command", async (event, args) => runFileCommand(args));
  ipcMain.on("node-command-sync", (event, args) => {
    try {
      if (!args || typeof args.operation !== "string") {
        throw new TypeError("Invalid Node operation");
      }
      const stringValue = (value) => {
        if (typeof value !== "string") {
          throw new TypeError("Invalid string argument");
        }
        return value;
      };
      const stringArgs = (values) => {
        if (
          !Array.isArray(values) ||
          values.some((value) => typeof value !== "string")
        ) {
          throw new TypeError("Invalid string arguments");
        }
        return values;
      };
      let value;
      switch (args.operation) {
        case "path-join":
          value = path.join(...stringArgs(args.values));
          break;
        case "path-dirname":
          value = path.dirname(stringValue(args.value));
          break;
        case "path-basename":
          value = path.basename(stringValue(args.value), args.suffix);
          break;
        case "path-extname":
          value = path.extname(stringValue(args.value));
          break;
        case "path-resolve":
          value = path.resolve(...stringArgs(args.values));
          break;
        case "path-posix-join":
          value = path.posix.join(...stringArgs(args.values));
          break;
        case "os-homedir":
          value = os.homedir();
          break;
        case "crypto-md5":
          value = nodeCrypto
            .createHash("md5")
            .update(normalizeFileData(args.data))
            .digest("hex");
          break;
        default:
          throw new Error(`Unsupported Node operation: ${args.operation}`);
      }
      event.returnValue = { ok: true, value };
    } catch (error) {
      event.returnValue = {
        ok: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code:
            error && typeof error.code === "string" ? error.code : undefined,
        },
      };
    }
  });
  ipcMain.handle("open-external", (event, url) => {
    if (typeof url !== "string" || !/^https?:|^mailto:/i.test(url)) {
      throw new TypeError("Invalid external URL");
    }
    return shell.openExternal(url);
  });
  ipcMain.on("clipboard-read-text-sync", (event) => {
    event.returnValue = clipboard.readText();
  });
  ipcMain.handle("dict-lookup", (event, args) => {
    const filePath = args && args.filePath;
    if (typeof (args && args.word) !== "string")
      throw new TypeError("Invalid dictionary word");
    const { MDX } = require("js-mdict");
    const result = new MDX(filePath).lookup(args.word);
    return result &&
      result.definition !== undefined &&
      result.definition !== null
      ? String(result.definition)
      : "";
  });
  ipcMain.handle("partial-md5", (event, filePath) => {
    const validatedPath = filePath;
    const hash = nodeCrypto.createHash("md5");
    const fd = fs.openSync(validatedPath, "r");
    try {
      const buffer = Buffer.alloc(1024);
      for (let i = -1; i <= 10; i++) {
        const position = 1024 << (2 * i);
        const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, position);
        if (!bytesRead) break;
        hash.update(buffer.subarray(0, bytesRead));
      }
      return hash.digest("hex");
    } finally {
      fs.closeSync(fd);
    }
  });
  ipcMain.handle("crypto-file-md5", (event, filePath) => {
    if (typeof filePath !== "string" || !filePath) {
      throw new TypeError("Invalid file path");
    }
    return new Promise((resolve, reject) => {
      const hash = nodeCrypto.createHash("md5");
      const stream = fs.createReadStream(filePath);
      stream.on("error", reject);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
    });
  });
  ipcMain.handle("cancel-download-app", (event, arg) => {
    // Implement cancellation logic here
    // Note: In this example, we are not keeping a reference to the request,
    // so we cannot actually abort it. This is a placeholder for demonstration.
    if (downloadRequest) {
      downloadRequest.abort();
      downloadRequest = null;
    }
    event.returnValue = "cancelled";
  });
  // Discord RPC handlers
  ipcMain.handle("discord-rpc-update", async (event, config) => {
    await setDiscordActivity(config);
  });
  ipcMain.handle("discord-rpc-clear", async (event) => {
    await clearDiscordActivity();
  });
  ipcMain.handle("update-win-app", (event, config) => {
    let fileName = `koodo-reader-installer.exe`;
    let supportedArchs = ["x64", "ia32", "arm64"];
    //get system arch
    let arch = os.arch();
    if (!supportedArchs.includes(arch)) {
      return;
    }

    let url = `https://dl.koodoreader.com/v${config.version}/Koodo-Reader-${config.version}-${arch}.exe`;
    const https = require("https");
    const { spawn } = require("child_process");
    const file = fs.createWriteStream(path.join(app.getPath("temp"), fileName));
    downloadRequest = https.get(url, (res) => {
      const totalSize = parseInt(res.headers["content-length"], 10);
      let downloadedSize = 0;
      res.on("data", (chunk) => {
        downloadedSize += chunk.length;
        const progress = ((downloadedSize / totalSize) * 100).toFixed(2);
        const downloadedMB = (downloadedSize / 1024 / 1024).toFixed(2);
        const totalMB = (totalSize / 1024 / 1024).toFixed(2);
        mainWin.webContents.send("download-app-progress", {
          progress,
          downloadedMB,
          totalMB,
        });
      });

      res.pipe(file);
      file.on("finish", () => {
        console.info("\n下载完成！");
        file.close();

        let updateExePath = path.join(app.getPath("temp"), fileName);
        if (!fs.existsSync(updateExePath)) {
          console.error("更新包不存在:", updateExePath);
          return;
        }
        // 验证文件可执行性
        try {
          fs.accessSync(updateExePath, fs.constants.X_OK);
          console.info("更新包可执行性验证通过");
        } catch (err) {
          console.error("更新包不可执行:", err.message);
          return;
        }
        try {
          // 先退出应用，再启动安装程序，避免文件锁定导致覆盖安装失败
          app.once("will-quit", () => {
            const child = spawn(updateExePath, [], {
              stdio: "ignore",
              detached: true,
              shell: true,
              windowsHide: false,
            });
            child.unref();
          });
          app.quit();
        } catch (err) {
          console.error(`spawn 执行异常: ${err.message}`);
        }
      });
    });
  });
  ipcMain.handle("open-book", (event, config) => {
    let { url, isMergeWord, isAutoFullscreen, isAutoMaximize, isPreventSleep } =
      config;
    if (isMergeWord) {
      delete options.backgroundColor;
    }
    store.set({
      url,
      isMergeWord: isMergeWord || "no",
      isAutoFullscreen: isAutoFullscreen || "no",
      isAutoMaximize: isAutoMaximize || "no",
      isPreventSleep: isPreventSleep || "no",
    });
    let id;
    if (isPreventSleep === "yes") {
      id = powerSaveBlocker.start("prevent-display-sleep");
      console.info(powerSaveBlocker.isStarted(id));
    }
    if (readerWindow) {
      readerWindowList.push(readerWindow);
    }
    if (isAutoFullscreen === "yes" || isAutoMaximize === "yes") {
      readerWindow = new BrowserWindow(options);
      readerWindow.webContents.on(
        "console-message",
        (_event, level, message) => {
          const lvl =
            { 0: "info", 1: "info", 2: "warn", 3: "error" }[level] || "info";
          log[lvl](`[Renderer] ${message}`);
        }
      );
      readerWindow.loadURL(url);
      if (isAutoFullscreen === "yes") {
        readerWindow.setFullScreen(true);
      } else if (isAutoMaximize === "yes") {
        readerWindow.maximize();
      }
    } else {
      const scaleRatio = store.get("windowDisplayScale") || 1;
      const isWindowVisible = isWindowPartiallyVisible({
        x: parseInt(store.get("windowX")),
        y: parseInt(store.get("windowY")),
        width: parseInt(store.get("windowWidth") || 1050) / scaleRatio,
        height: parseInt(store.get("windowHeight") || 660) / scaleRatio,
      });
      readerWindow = new BrowserWindow({
        ...options,
        width: parseInt(store.get("windowWidth") || 1050) / scaleRatio,
        height: parseInt(store.get("windowHeight") || 660) / scaleRatio,
        x: isWindowVisible ? parseInt(store.get("windowX")) : undefined,
        y: isWindowVisible ? parseInt(store.get("windowY")) : undefined,
        frame: isMergeWord === "yes" ? false : true,
        hasShadow: isMergeWord === "yes" ? false : true,
        transparent: isMergeWord === "yes" ? true : false,
      });
      readerWindow.webContents.on(
        "console-message",
        (_event, level, message) => {
          const lvl =
            { 0: "info", 1: "info", 2: "warn", 3: "error" }[level] || "info";
          log[lvl](`[Renderer] ${message}`);
        }
      );
      readerWindow.loadURL(url);
      // readerWindow.webContents.openDevTools();
    }
    if (store.get("isAlwaysOnTop") === "yes") {
      readerWindow.setAlwaysOnTop(true);
    }
    readerWindowReadyToClose = false;
    readerWindow.on("close", (event) => {
      // --- Step 1: ask renderer to flush reading-time data first ---
      if (
        !readerWindowReadyToClose &&
        readerWindow &&
        !readerWindow.isDestroyed()
      ) {
        event.preventDefault();
        readerWindow.webContents.send("before-reader-close");
        return;
      }
      // --- Step 2: actual close logic (reached after renderer replied) ---
      if (readerWindow && !readerWindow.isDestroyed()) {
        let bounds = readerWindow.getBounds();
        const currentDisplay = screen.getDisplayMatching(bounds);
        const primaryDisplay = screen.getPrimaryDisplay();
        if (bounds.width > 300 && bounds.height > 100) {
          store.set({
            windowWidth: bounds.width,
            windowHeight: bounds.height,
            windowX:
              readerWindow.isMaximized() &&
              currentDisplay.id === primaryDisplay.id
                ? 0
                : bounds.x,
            windowY:
              readerWindow.isMaximized() &&
              currentDisplay.id === primaryDisplay.id
                ? 0
                : bounds.y < 0
                  ? 0
                  : bounds.y,
            windowDisplayScale:
              currentDisplay.scaleFactor / primaryDisplay.scaleFactor,
          });
        }
      }
      if (isPreventSleep && !readerWindow.isDestroyed()) {
        id && powerSaveBlocker.stop(id);
      }
      if (mainWin && !mainWin.isDestroyed()) {
        mainWin.webContents.send("reading-finished", {});
      }
      clearDiscordActivity();
    });
    // Renderer finished flushing reading-time data — proceed with actual close
    ipcMain.once("reader-close-ready", () => {
      if (readerWindow && !readerWindow.isDestroyed()) {
        readerWindowReadyToClose = true;
        readerWindow.close();
      }
    });

    event.returnValue = "success";
  });
  ipcMain.handle("generate-tts", async (event, voiceConfig) => {
    const { text, speed, pluginKey, config } = voiceConfig || {};
    const plugin = getVoicePlugin(pluginKey);
    if (
      !plugin ||
      typeof text !== "string" ||
      typeof speed !== "number" ||
      !Number.isFinite(speed) ||
      !config ||
      typeof config !== "object" ||
      Array.isArray(config)
    ) {
      throw new Error("Invalid TTS plugin request");
    }
    const audioPath = await plugin.getAudioPath(text, speed, dirPath, config);
    if (
      typeof audioPath === "string" &&
      path.isAbsolute(audioPath) &&
      fs.existsSync(audioPath)
    ) {
      return pathToFileURL(audioPath).toString();
    }
    return audioPath;
  });
  ipcMain.handle("get-tts-voices", async (event, request) => {
    const { pluginKey, config } = request || {};
    const plugin = getVoicePlugin(pluginKey);
    if (
      !plugin ||
      typeof plugin.getTTSVoice !== "function" ||
      !config ||
      typeof config !== "object" ||
      Array.isArray(config)
    ) {
      throw new Error("Invalid TTS voice request");
    }
    const voices = await plugin.getTTSVoice(config);
    if (!Array.isArray(voices)) {
      throw new Error("Invalid TTS voice list");
    }
    return voices;
  });
  ipcMain.handle("cloud-upload", async (event, config) => {
    let syncUtil = await getSyncUtil(config, config.isUseCache);
    let result = await syncUtil.uploadFile(
      config.fileName,
      config.fileName,
      config.type
    );
    return result;
  });

  ipcMain.handle("cloud-download", async (event, config) => {
    let syncUtil = await getSyncUtil(config);
    let result = await syncUtil.downloadFile(
      config.fileName,
      (config.isTemp ? "temp-" : "") + config.fileName,
      config.type
    );
    return result;
  });
  ipcMain.handle("cloud-progress", async (event, config) => {
    let syncUtil = await getSyncUtil(config);
    let result = syncUtil.getDownloadedSize();
    return result;
  });
  ipcMain.handle("picker-download", async (event, config) => {
    let pickerUtil = await getPickerUtil(config);
    let result = await pickerUtil.remote.downloadFile(
      config.sourcePath,
      config.destPath
    );
    return result;
  });
  ipcMain.handle("picker-progress", async (event, config) => {
    let pickerUtil = await getPickerUtil(config);
    let result = await pickerUtil.getDownloadedSize();
    return result;
  });
  ipcMain.handle("cloud-reset", async (event, config) => {
    let syncUtil = await getSyncUtil(config);
    let result = syncUtil.resetCounters();
    return result;
  });
  ipcMain.handle("cloud-stats", async (event, config) => {
    let syncUtil = await getSyncUtil(config);
    let result = syncUtil.getStats();
    return result;
  });
  ipcMain.handle("cloud-delete", async (event, config) => {
    try {
      let syncUtil = await getSyncUtil(config, config.isUseCache);
      let result = await syncUtil.deleteFile(config.fileName, config.type);
      return result;
    } catch (error) {
      console.error("Error deleting file:", error);
    }
    return false;
  });

  ipcMain.handle("cloud-list", async (event, config) => {
    let syncUtil = await getSyncUtil(config);
    let result = await syncUtil.listFiles(config.type);
    return result;
  });
  ipcMain.handle("picker-list", async (event, config) => {
    let pickerUtil = await getPickerUtil(config);
    let result = await pickerUtil.listFileInfos(config.currentPath);
    return result;
  });
  ipcMain.handle("cloud-exist", async (event, config) => {
    let syncUtil = await getSyncUtil(config);
    let result = await syncUtil.isExist(config.fileName, config.type);
    return result;
  });
  ipcMain.handle("cloud-close", async (event, config) => {
    removeSyncUtil(config);
    return "pong";
  });

  ipcMain.handle("clear-tts", async (event, config) => {
    if (!fs.existsSync(path.join(dirPath, "tts"))) {
      return "pong";
    } else {
      const fsExtra = require("fs-extra");
      try {
        await fsExtra.remove(path.join(dirPath, "tts"));
        await fsExtra.mkdir(path.join(dirPath, "tts"));
        return "pong";
      } catch (err) {
        console.error(err);
        return "pong";
      }
    }
  });
  ipcMain.handle("select-path", async (event) => {
    var path = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    return path.filePaths[0];
  });
  ipcMain.handle("select-file", async (event, config) => {
    const dialogOptions = { properties: ["openFile"] };
    if (config && config.filters) {
      dialogOptions.filters = config.filters;
    }
    var result = await dialog.showOpenDialog(dialogOptions);
    return result.filePaths[0];
  });
  ipcMain.handle("encrypt-data", async (event, config) => {
    let fingerprint = await getFingerprint();
    let encrypted = encrypt(config.token, fingerprint);
    store.set("encryptedToken", encrypted);
    return "pong";
  });
  ipcMain.handle("decrypt-data", async (event) => {
    let encrypted = store.get("encryptedToken");
    if (!encrypted) return "";
    let fingerprint = await getFingerprint();
    let decrypted = decrypt(encrypted, fingerprint);
    if (decrypted.startsWith("{") && decrypted.endsWith("}")) {
      return decrypted;
    } else {
      try {
        const { safeStorage } = require("electron");
        decrypted = safeStorage.decryptString(Buffer.from(encrypted, "base64"));
        let newEncrypted = encrypt(decrypted, fingerprint);
        store.set("encryptedToken", newEncrypted);
        return decrypted;
      } catch (error) {
        console.error("Decryption failed:", error);
        return "{}";
      }
    }
  });
  ipcMain.handle("check-cloud-url", async (event, config) => {
    const { url } = config;
    return checkCloudUrl(url);
  });
  ipcMain.handle("get-proxy-config", async () => {
    const config = store.get("proxyConfig") || {
      enabled: false,
      type: "none",
      host: "",
      port: 0,
      username: "",
      password: "",
    };
    return config;
  });
  ipcMain.handle("set-proxy-config", async (event, config) => {
    const { enabled, type, host, port, username, password } = config || {};
    const validTypes = ["none", "http", "socks5"];
    if (!validTypes.includes(type)) {
      return { ok: false, reason: "invalid_input" };
    }
    if (type !== "none") {
      if (!host || typeof host !== "string" || host.includes("://")) {
        return { ok: false, reason: "invalid_input" };
      }
      const portNumber = parseInt(port);
      if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
        return { ok: false, reason: "invalid_input" };
      }
    }
    const finalEnabled = type === "none" ? false : !!enabled;
    const configToStore = {
      enabled: finalEnabled,
      type,
      host: type === "none" ? "" : host,
      port: type === "none" ? 0 : parseInt(port),
      username: type === "none" ? "" : username || "",
      password: type === "none" ? "" : password || "",
    };
    store.set("proxyConfig", configToStore);
    await applyProxyToSession();
    return { ok: true };
  });
  ipcMain.handle("test-proxy-connection", async (event, config) => {
    return testProxyConnection(config);
  });
  ipcMain.handle("get-mac", async (event, config) => {
    const { machineIdSync } = require("node-machine-id");
    return machineIdSync();
  });
  ipcMain.handle("get-device-name", async () => {
    return os.hostname() || "";
  });
  ipcMain.handle("get-biometric-capability", async () => {
    return await getBiometricCapability();
  });
  ipcMain.handle("prompt-biometric-auth", async (event, config) => {
    const senderWindow =
      BrowserWindow.fromWebContents(event.sender) ||
      BrowserWindow.getFocusedWindow() ||
      mainWin ||
      null;
    return await promptBiometricAuth(config?.message, senderWindow);
  });

  ipcMain.handle("reset-reader-position", async (event) => {
    store.delete("windowX");
    store.delete("windowY");
    return "success";
  });
  ipcMain.handle("reset-main-position", async (event) => {
    store.delete("mainWinX");
    store.delete("mainWinY");
    app.relaunch();
    app.exit();
    return "success";
  });

  ipcMain.handle("select-zip-file", async (event, config) => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Zip Files", extensions: ["zip"] }],
    });

    if (result.canceled) {
      return "";
    } else {
      const filePath = result.filePaths[0];
      return filePath;
    }
  });

  ipcMain.handle("select-book", async (event, config) => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Books",
          extensions: [
            "epub",
            "pdf",
            "txt",
            "mobi",
            "azw3",
            "azw",
            "htm",
            "html",
            "xml",
            "xhtml",
            "mhtml",
            "docx",
            "md",
            "fb2",
            "cbz",
            "cbt",
            "cbr",
            "cb7",
          ],
        },
      ],
    });

    if (result.canceled) {
      console.info("User canceled the file selection");
      return [];
    } else {
      const filePaths = result.filePaths;
      console.info("Selected file path:", filePaths);
      return filePaths;
    }
  });
  ipcMain.handle("custom-database-command", async (event, config) => {
    const { SqlStatement } =
      await import("./src/assets/lib/kookit-extra.min.mjs");
    let { query, storagePath, data, dbName, executeType } = config;
    let db = getDBConnection(dbName, storagePath, SqlStatement.sqlStatement);
    const row = db.prepare(query);
    let result;
    if (data && data.length > 0) {
      result = row[executeType](...data);
    } else {
      result = row[executeType]();
    }
    return result;
  });
  ipcMain.handle("database-command", async (event, config) => {
    const { SqlStatement } =
      await import("./src/assets/lib/kookit-extra.min.mjs");
    let { statement, statementType, executeType, dbName, data, storagePath } =
      config;
    let db = getDBConnection(dbName, storagePath, SqlStatement.sqlStatement);
    let sql = "";
    if (statementType === "string") {
      sql = SqlStatement.sqlStatement[statement][dbName];
    } else if (statementType === "function") {
      sql = SqlStatement.sqlStatement[statement][dbName](data);
    }
    const row = db.prepare(sql);
    let result;
    if (data) {
      if (statement.startsWith("save") || statement.startsWith("update")) {
        data = SqlStatement.jsonToSqlite[dbName](data);
      }
      result = row[executeType](data);
    } else {
      result = row[executeType]();
    }
    if (executeType === "all") {
      return result.map((item) => SqlStatement.sqliteToJson[dbName](item));
    } else if (executeType === "get") {
      return SqlStatement.sqliteToJson[dbName](result);
    } else {
      return result;
    }
  });
  ipcMain.handle("close-database", async (event, config) => {
    const { SqlStatement } =
      await import("./src/assets/lib/kookit-extra.min.mjs");
    let { dbName, storagePath } = config;
    let db = getDBConnection(dbName, storagePath, SqlStatement.sqlStatement);
    delete dbConnection[dbName];
    // Flush WAL into the main .db file and flip to rollback journal mode so the
    // on-disk file is self-contained (header read/write version = 1, no -wal
    // dependency). Other consumers — e.g. the Expo app's expo-sqlite
    // deserializeDatabaseAsync — can only open a non-WAL SQLite image; without
    // this, backups restored there fail with "unable to open database file".
    try {
      db.pragma("wal_checkpoint(TRUNCATE)");
      db.pragma("journal_mode = DELETE");
    } catch (error) {
      console.error("failed to checkpoint/switch journal mode:", error);
    }
    db.close();
  });
  // 流式打包备份：遍历 dataPath 下的固定目录与配置文件，
  // 用 yazl 逐文件 addFile 直接写入目标 zip，避免将整库读入内存。
  ipcMain.handle("backup-path", async (event, config) => {
    return backupToPath(config, (percent) => {
      if (mainWin && !mainWin.isDestroyed()) {
        mainWin.webContents.send("backup-progress", { percent });
      }
    });
  });
  // 流式解压恢复：restoreFromPath 直接流式写盘资产文件，config 类文件
  // 回传渲染进程处理（.db 经 sql.js 合并，json 写入 ConfigService）。
  ipcMain.handle("restore-path", async (event, config) => {
    return restoreFromPath(config, (percent) => {
      if (mainWin && !mainWin.isDestroyed()) {
        mainWin.webContents.send("restore-progress", { percent });
      }
    });
  });
  // ---- Comic 压缩包（CBZ / CBT / CBR 等）按需解压 ----
  // list-*-file：列出压缩包内的条目名；*-file：把指定的条目按需解压到
  // dirPath/comic 目录，返回解压后的绝对路径列表。条目路径统一做穿越校验。
  const assertExistingArchiveFile = (config, label) => {
    const filePath = config && config.filePath;
    if (typeof filePath !== "string" || !filePath) {
      throw new TypeError(`Invalid ${label} path`);
    }
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      throw new Error(`${label} not found: ${filePath}`);
    }
    return filePath;
  };
  const parseArchiveEntries = (entries) => {
    if (entries === undefined || entries === null) return null;
    if (!Array.isArray(entries) || entries.some((e) => typeof e !== "string")) {
      throw new TypeError("Invalid entries: expected an array of entry names");
    }
    return new Set(entries.map(normalizeArchiveEntryName));
  };
  ipcMain.handle("list-zip-file", async (event, config) => {
    const filePath = assertExistingArchiveFile(config, "zip file");
    return new Promise((resolve, reject) => {
      const names = [];
      yauzl.open(
        filePath,
        { lazyEntries: true, autoClose: true },
        (err, zipfile) => {
          if (err) return reject(err);
          zipfile.on("error", reject);
          zipfile.on("entry", (entry) => {
            if (!/[/\\]$/.test(entry.fileName)) {
              const entryPath = normalizeArchiveEntryName(entry.fileName);
              names.push({
                entryPath,
                size: entry.uncompressedSize ?? 0,
                fileName: path.posix.basename(entryPath),
              });
            }
            zipfile.readEntry();
          });
          zipfile.on("end", () => resolve(names));
          zipfile.readEntry();
        }
      );
    });
  });
  ipcMain.handle("unzip-file", async (event, config) => {
    const filePath = assertExistingArchiveFile(config, "zip file");
    const wanted = parseArchiveEntries(config && config.entries);
    const baseDir = path.join(dirPath, "comic");
    fs.mkdirSync(baseDir, { recursive: true });
    return new Promise((resolve, reject) => {
      const results = [];
      const fail = (err) => reject(err);
      yauzl.open(
        filePath,
        { lazyEntries: true, autoClose: true },
        (err, zipfile) => {
          if (err) return fail(err);
          zipfile.on("error", fail);
          zipfile.on("end", () => resolve(results));
          const advance = () => zipfile.readEntry();
          zipfile.on("entry", (entry) => {
            const name = normalizeArchiveEntryName(entry.fileName);
            const isDir = /[/\\]$/.test(entry.fileName);
            const matches = !wanted || wanted.has(name);
            if (isDir) {
              if (matches) {
                try {
                  fs.mkdirSync(ensureEntryInside(baseDir, name), {
                    recursive: true,
                  });
                } catch (e) {
                  return fail(e);
                }
              }
              advance();
              return;
            }
            if (matches) {
              zipfile.openReadStream(entry, (openErr, readStream) => {
                if (openErr) return fail(openErr);
                let dest;
                try {
                  dest = ensureEntryInside(baseDir, name);
                  fs.mkdirSync(path.dirname(dest), { recursive: true });
                } catch (e) {
                  return fail(e);
                }
                const output = fs.createWriteStream(dest);
                output.on("error", fail);
                readStream.on("error", fail);
                output.on("close", () => {
                  results.push(dest);
                  advance();
                });
                readStream.pipe(output);
              });
            } else {
              advance();
            }
          });
          zipfile.readEntry();
        }
      );
    });
  });
  ipcMain.handle("list-tar-file", async (event, config) => {
    const filePath = assertExistingArchiveFile(config, "tar file");
    const index = await ensureTarIndex(filePath);
    if (index.ok) return index.list;
    return new Promise((resolve, reject) => {
      const names = [];
      const extract = tarStream.extract();
      extract.on("error", reject);
      extract.on("finish", () => resolve(names));
      extract.on("entry", (header, stream, next) => {
        if (header.type === "file") {
          const entryPath = normalizeArchiveEntryName(header.name);
          names.push({
            entryPath,
            size: header.size ?? 0,
            fileName: path.posix.basename(entryPath),
          });
        }
        stream.resume();
        stream.on("end", next);
      });
      fs.createReadStream(filePath).on("error", reject).pipe(extract);
    });
  });
  ipcMain.handle("untar-file", async (event, config) => {
    const filePath = assertExistingArchiveFile(config, "tar file");
    const wanted = parseArchiveEntries(config && config.entries);
    const baseDir = path.join(dirPath, "comic");
    fs.mkdirSync(baseDir, { recursive: true });
    try {
      const index = await ensureTarIndex(filePath);
      if (index.ok) {
        const extracted = await extractTarByOffsets(
          filePath,
          index,
          wanted,
          baseDir
        );
        if (extracted) return extracted;
      }
    } catch (e) {
      console.error("tar offset extract failed, fallback to stream:", e);
    }
    return new Promise((resolve, reject) => {
      const results = [];
      let settled = false;
      const fail = (err) => {
        if (!settled) {
          settled = true;
          reject(err);
        }
      };
      const extract = tarStream.extract();
      extract.on("error", fail);
      extract.on("finish", () => {
        if (!settled) {
          settled = true;
          resolve(results);
        }
      });
      extract.on("entry", (header, stream, next) => {
        const name = normalizeArchiveEntryName(header.name);
        const matches = !wanted || wanted.has(name);
        if (header.type === "directory") {
          if (matches) {
            try {
              fs.mkdirSync(ensureEntryInside(baseDir, name), {
                recursive: true,
              });
            } catch (e) {
              return fail(e);
            }
          }
          stream.resume();
          stream.on("end", next);
          return;
        }
        if (header.type === "file" && matches) {
          let dest;
          try {
            dest = ensureEntryInside(baseDir, name);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
          } catch (e) {
            return fail(e);
          }
          const output = fs.createWriteStream(dest);
          output.on("error", fail);
          stream.on("error", fail);
          output.on("close", () => {
            results.push(dest);
            next();
          });
          stream.pipe(output);
          return;
        }
        stream.resume();
        stream.on("end", next);
      });
      fs.createReadStream(filePath).on("error", fail).pipe(extract);
    });
  });
  ipcMain.handle("set-always-on-top", async (event, config) => {
    store.set("isAlwaysOnTop", config.isAlwaysOnTop);
    if (mainWin && !mainWin.isDestroyed()) {
      if (config.isAlwaysOnTop === "yes") {
        mainWin.setAlwaysOnTop(true);
      } else {
        mainWin.setAlwaysOnTop(false);
      }
    }
    if (readerWindow && !readerWindow.isDestroyed()) {
      if (config.isAlwaysOnTop === "yes") {
        readerWindow.setAlwaysOnTop(true);
      } else {
        readerWindow.setAlwaysOnTop(false);
      }
    }
    return "pong";
  });
  ipcMain.handle("set-auto-maximize", async (event, config) => {
    store.set("isAutoMaximizeWin", config.isAutoMaximizeWin);
    if (mainWin && !mainWin.isDestroyed()) {
      if (config.isAutoMaximizeWin === "yes") {
        mainWin.maximize();
      } else {
        mainWin.unmaximize();
      }
    }
    if (readerWindow && !readerWindow.isDestroyed()) {
      if (config.isAlwaysOnTop === "yes") {
        readerWindow.setAlwaysOnTop(true);
      } else {
        readerWindow.setAlwaysOnTop(false);
      }
    }
    return "pong";
  });
  ipcMain.handle("toggle-auto-launch", async (event, config) => {
    app.setLoginItemSettings({
      openAtLogin: config.isAutoLaunch === "yes",
    });
    return "pong";
  });
  ipcMain.handle("toggle-minimize-to-tray", async (event, config) => {
    store.set("isMinimizeToTray", config.isMinimizeToTray);
    if (config.isMinimizeToTray === "no" && tray) {
      tray.destroy();
      tray = null;
    }
    return "pong";
  });
  ipcMain.handle("open-explorer-folder", async (event, config) => {
    const { shell } = require("electron");
    if (config.isFolder) {
      shell.openPath(config.path);
    } else {
      shell.showItemInFolder(config.path);
    }

    return "pong";
  });
  ipcMain.handle("get-debug-logs", async (event, config) => {
    const { shell } = require("electron");
    const file = log.transports.file.getFile();
    shell.showItemInFolder(file.path);
    return "pong";
  });

  ipcMain.on("user-data", (event, arg) => {
    event.returnValue = dirPath;
  });
  ipcMain.handle("hide-reader", (event, arg) => {
    if (
      readerWindow &&
      !readerWindow.isDestroyed() &&
      readerWindow.isFocused()
    ) {
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
    if (readerWindowList.length > 0) {
      readerWindowList.forEach((win) => {
        if (
          win &&
          !win.isDestroyed() &&
          win.webContents.getURL().indexOf(arg.bookKey) > -1
        ) {
          win.reload();
        }
      });
    }
    if (
      readerWindow &&
      !readerWindow.isDestroyed() &&
      readerWindow.webContents.getURL().indexOf(arg.bookKey) > -1
    ) {
      readerWindow.reload();
    }
  });
  ipcMain.handle("reload-main", (event, arg) => {
    if (mainWin) {
      mainWin.reload();
    }
  });

  ipcMain.handle("new-chat", (event, config) => {
    if (!chatWindow && mainWin) {
      let bounds = mainWin.getBounds();
      chatWindow = new BrowserWindow({
        ...options,
        width: 450,
        height: bounds.height,
        x: bounds.x + (bounds.width - 450),
        y: bounds.y,
        frame: true,
        hasShadow: true,
        transparent: false,
        webPreferences: {
          ...options.webPreferences,
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, "chat-preload.js"),
        },
      });
      chatWindow.loadURL(config.url);
      chatWindow.on("close", (event) => {
        chatWindow && chatWindow.destroy();
        chatWindow = null;
      });
    } else if (chatWindow && !chatWindow.isDestroyed()) {
      chatWindow.show();
      chatWindow.focus();
    }
  });
  ipcMain.on("chat-message", (event, msg) => {
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.send("chat-message", msg);
    }
  });
  ipcMain.handle("clear-all-data", (event, config) => {
    store.clear();
  });
  ipcMain.handle("new-tab", (event, config) => {
    if (mainWin) {
      mainView = new WebContentsView(options);
      mainWin.contentView.addChildView(mainView);
      let { width, height } = mainWin.getContentBounds();
      mainView.setBounds({ x: 0, y: 0, width: width, height: height });
      mainView.webContents.loadURL(config.url);
      mainView.webContents.on("console-message", (_event, level, message) => {
        const lvl =
          { 0: "info", 1: "info", 2: "warn", 3: "error" }[level] || "info";
        log[lvl](`[Renderer] ${message}`);
      });
    }
  });
  ipcMain.handle("reload-tab", (event, config) => {
    if (mainWin && mainView) {
      mainView.webContents.reload();
    }
  });
  ipcMain.handle("adjust-tab-size", (event, config) => {
    if (mainWin && mainView) {
      let { width, height } = mainWin.getContentBounds();
      mainView.setBounds({ x: 0, y: 0, width: width, height: height });
    }
  });
  ipcMain.handle("exit-tab", (event, message) => {
    return new Promise((resolve) => {
      const doRemoveTab = () => {
        if (mainWin && mainView) {
          mainWin.contentView.removeChildView(mainView);
        }
        clearDiscordActivity();
        resolve(undefined);
      };

      // Ask the tab renderer to flush reading-time data first, then close
      if (mainView && !mainView.webContents.isDestroyed()) {
        const timeoutId = setTimeout(() => {
          // Fallback: if renderer doesn't reply within 3s, close anyway
          ipcMain.removeListener("tab-close-ready", onTabCloseReady);
          doRemoveTab();
        }, 3000);
        const onTabCloseReady = () => {
          clearTimeout(timeoutId);
          doRemoveTab();
        };
        ipcMain.once("tab-close-ready", onTabCloseReady);
        mainView.webContents.send("before-tab-close");
      } else {
        doRemoveTab();
      }
    });
  });
  ipcMain.handle("enter-tab-fullscreen", () => {
    if (mainWin && mainView) {
      mainWin.setFullScreen(true);
      console.info("enter full");
    }
  });
  ipcMain.handle("exit-tab-fullscreen", () => {
    if (mainWin && mainView) {
      mainWin.setFullScreen(false);
      console.info("exit full");
    }
  });
  ipcMain.handle("enter-fullscreen", () => {
    if (readerWindow) {
      readerWindow.setFullScreen(true);
      console.info("enter full");
    }
  });
  ipcMain.handle("exit-fullscreen", () => {
    if (readerWindow && !readerWindow.isDestroyed()) {
      readerWindow.setFullScreen(false);
      console.info("exit full");
    }
  });
  ipcMain.handle("open-url", async (event, config) => {
    if (config.type === "dict") {
      if (!dictWindow || dictWindow.isDestroyed()) {
        dictWindow = new BrowserWindow();
      }
      dictWindow.focus();
      await loadUrlInAuxWindow(dictWindow, config.url);
    } else if (config.type === "trans") {
      if (!transWindow || transWindow.isDestroyed()) {
        transWindow = new BrowserWindow();
      }
      transWindow.focus();
      await loadUrlInAuxWindow(transWindow, config.url);
    } else {
      if (!linkWindow || linkWindow.isDestroyed()) {
        linkWindow = new BrowserWindow();
      }
      linkWindow.loadURL(config.url);
      linkWindow.focus();
    }

    event.returnvalue = true;
  });
  ipcMain.handle("switch-moyu", (event, arg) => {
    let id;
    if (store.get("isPreventSleep") === "yes") {
      id = powerSaveBlocker.start("prevent-display-sleep");
      console.info(powerSaveBlocker.isStarted(id));
    }
    if (readerWindow && !readerWindow.isDestroyed()) {
      readerWindowReadyToClose = true;
      readerWindow.close();
      if (store.get("isMergeWord") === "yes") {
        delete options.backgroundColor;
      }
      const scaleRatio = store.get("windowDisplayScale") || 1;
      Object.assign(options, {
        width: parseInt(store.get("windowWidth") || 1050) / scaleRatio,
        height: parseInt(store.get("windowHeight") || 660) / scaleRatio,
        x: parseInt(store.get("windowX")),
        y: parseInt(store.get("windowY")),
        frame: store.get("isMergeWord") !== "yes" ? false : true,
        hasShadow: store.get("isMergeWord") !== "yes" ? false : true,
        transparent: store.get("isMergeWord") !== "yes" ? true : false,
      });

      store.set(
        "isMergeWord",
        store.get("isMergeWord") !== "yes" ? "yes" : "no"
      );
      if (readerWindow) {
        readerWindowList.push(readerWindow);
      }
      readerWindow = new BrowserWindow(options);
      if (store.get("isAlwaysOnTop") === "yes") {
        readerWindow.setAlwaysOnTop(true);
      }
      readerWindow.webContents.on(
        "console-message",
        (_event, level, message) => {
          const lvl =
            { 0: "info", 1: "info", 2: "warn", 3: "error" }[level] || "info";
          log[lvl](`[Renderer] ${message}`);
        }
      );
      readerWindow.loadURL(store.get("url"));
      readerWindowReadyToClose = false;
      readerWindow.on("close", (event) => {
        // --- Step 1: ask renderer to flush reading-time data first ---
        if (
          !readerWindowReadyToClose &&
          readerWindow &&
          !readerWindow.isDestroyed()
        ) {
          event.preventDefault();
          readerWindow.webContents.send("before-reader-close");
          return;
        }
        // --- Step 2: actual close logic (reached after renderer replied) ---
        if (!readerWindow.isDestroyed()) {
          let bounds = readerWindow.getBounds();
          const currentDisplay = screen.getDisplayMatching(bounds);
          const primaryDisplay = screen.getPrimaryDisplay();
          if (bounds.width > 300 && bounds.height > 100) {
            store.set({
              windowWidth: bounds.width,
              windowHeight: bounds.height,
              windowX:
                readerWindow.isMaximized() &&
                currentDisplay.id === primaryDisplay.id
                  ? 0
                  : bounds.x,
              windowY:
                readerWindow.isMaximized() &&
                currentDisplay.id === primaryDisplay.id
                  ? 0
                  : bounds.y < 0
                    ? 0
                    : bounds.y,
            });
          }
        }
        if (store.get("isPreventSleep") && !readerWindow.isDestroyed()) {
          id && powerSaveBlocker.stop(id);
        }
        if (mainWin && !mainWin.isDestroyed()) {
          mainWin.webContents.send("reading-finished", {});
        }
        clearDiscordActivity();
      });
      // Renderer finished flushing reading-time data — proceed with actual close
      ipcMain.once("reader-close-ready", () => {
        if (readerWindow && !readerWindow.isDestroyed()) {
          readerWindowReadyToClose = true;
          readerWindow.close();
        }
      });
    }
    event.returnvalue = false;
  });
  ipcMain.on("storage-location", (event, config) => {
    event.returnValue = path.join(dirPath, "data");
  });
  ipcMain.on("url-window-status", (event, config) => {
    if (config.type === "dict") {
      event.returnValue =
        dictWindow && !dictWindow.isDestroyed() ? true : false;
    } else if (config.type === "trans") {
      event.returnValue =
        transWindow && !transWindow.isDestroyed() ? true : false;
    } else {
      event.returnValue =
        linkWindow && !linkWindow.isDestroyed() ? true : false;
    }
  });
  ipcMain.on("get-dirname", (event, arg) => {
    event.returnValue = __dirname;
  });
  ipcMain.on("system-color", (event, arg) => {
    event.returnValue = getNativeDarkColorStatus() || false;
  });
  ipcMain.handle("set-native-theme-source", (event, appSkin) => {
    return applyNativeThemeSource(appSkin);
  });
  ipcMain.on("get-file-data", function (event) {
    if (fs.existsSync(path.join(dirPath, "log.json"))) {
      try {
        const _data = JSON.parse(
          fs.readFileSync(path.join(dirPath, "log.json"), "utf-8") || "{}"
        );
        if (_data && _data.filePath) {
          filePath = _data.filePath;
          setTimeout(() => {
            fs.writeFileSync(path.join(dirPath, "log.json"), "{}", "utf-8");
          }, 1000);
        }
      } catch (error) {
        console.error("Error reading log.json:", error);
      }
    }

    event.returnValue = filePath;
    filePath = null;
  });
  ipcMain.on("check-file-data", function (event) {
    if (fs.existsSync(path.join(dirPath, "log.json"))) {
      try {
        const _data = JSON.parse(
          fs.readFileSync(path.join(dirPath, "log.json"), "utf-8") || "{}"
        );
        if (_data && _data.filePath) {
          filePath = _data.filePath;
        }
      } catch (error) {
        console.error("Error reading log.json:", error);
      }
    }

    event.returnValue = filePath;
    filePath = null;
  });
  ipcMain.handle("system-ocr", async (event, config) => {
    const { base64, lang } = config || {};
    let tempPath = null;
    try {
      const { buffer, ext } = parseOcrImageInput(base64);
      tempPath = writeOcrTempImage(buffer, ext);
      const { macos, win } = resolveOcrLang(lang);
      let text = "";
      if (process.platform === "darwin") {
        text = await runMacosOcr(tempPath, macos);
      } else if (process.platform === "win32") {
        text = await runWindowsOcr(tempPath, win);
      } else {
        return {
          ok: false,
          error: "System OCR is only supported on Windows and macOS",
        };
      }
      return { ok: true, text };
    } catch (error) {
      log.error("system-ocr failed:", error.message);
      return { ok: false, error: error.message || "OCR failed" };
    } finally {
      if (tempPath) {
        try {
          fs.unlinkSync(tempPath);
        } catch (e) {
          // 忽略清理失败
        }
      }
    }
  });
};

const applyCorsToRendererRequests = () => {
  const filter = {
    urls: ["http://*/*", "https://*/*"],
  };
  session.defaultSession.webRequest.onHeadersReceived(
    filter,
    (details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        "Access-Control-Allow-Headers": "*, Authorization",
        "Access-Control-Expose-Headers": "*",
      };
      if (details.method === "OPTIONS") {
        corsHeaders["Access-Control-Max-Age"] = "86400";
      }
      for (const [name, value] of Object.entries(corsHeaders)) {
        for (const existingName of Object.keys(responseHeaders)) {
          if (existingName.toLowerCase() === name.toLowerCase()) {
            delete responseHeaders[existingName];
          }
        }
        responseHeaders[name] = [value];
      }
      callback({ responseHeaders });
    }
  );
};

app.on("ready", async () => {
  applyCorsToRendererRequests();
  await applyProxyToSession();
  createMainWin();
});
app.on("before-quit", () => {
  isQuitting = true;
  destroyDiscordRPC();
});
app.on("window-all-closed", () => {
  app.quit();
});
app.on("open-file", (e, pathToFile) => {
  filePath = pathToFile;
});
// Register protocol handler
app.setAsDefaultProtocolClient("koodo-reader");
const serializeArg = (arg) => {
  if (arg === null) return "null";
  if (arg === undefined) return "undefined";
  if (typeof arg === "object") {
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
};
const originalConsoleLog = console.log;
console.log = function (...args) {
  originalConsoleLog(...args); // 保留原日志
  log.info(args.map(serializeArg).join(" ")); // 写入日志文件
};
const originalConsoleError = console.error;
console.error = function (...args) {
  originalConsoleError(...args); // 保留原错误日志
  log.error(args.map(serializeArg).join(" ")); // 写入错误日志文件
};
const originalConsoleWarn = console.warn;
console.warn = function (...args) {
  originalConsoleWarn(...args); // 保留原警告日志
  log.warn(args.map(serializeArg).join(" ")); // 写入警告日志文件
};
const originalConsoleInfo = console.info;
console.info = function (...args) {
  originalConsoleInfo(...args); // 保留原信息日志
  log.info(args.map(serializeArg).join(" ")); // 写入信息日志文件
};
// Handle MacOS deep linking
app.on("open-url", (event, url) => {
  event.preventDefault();
  handleCallback(url);
});
const handleCallback = (url) => {
  try {
    // 检查 URL 是否有效
    if (!url.startsWith("koodo-reader://")) {
      console.error("Invalid URL format:", url);
      return;
    }

    // 解析 URL
    const parsedUrl = new URL(url);
    const code = parsedUrl.searchParams.get("code");
    const state = parsedUrl.searchParams.get("state");
    const pickerData = parsedUrl.searchParams.get("pickerData");

    const bookKey = parsedUrl.searchParams.get("bookKey");
    const noteKey = parsedUrl.searchParams.get("noteKey");
    const importUrl = parsedUrl.searchParams.get("importUrl");

    if (code && mainWin) {
      mainWin.webContents.send("oauth-callback", { code, state });
    }
    if (pickerData && mainWin) {
      let config = JSON.parse(decodeURIComponent(pickerData));
      mainWin.webContents.send("picker-finished", config);
    }
    if (bookKey && mainWin) {
      if (mainWin.isMinimized()) mainWin.restore();
      mainWin.show();
      mainWin.focus();
      mainWin.webContents.send("open-book-from-link", { bookKey });
    }
    if (noteKey && mainWin) {
      if (mainWin.isMinimized()) mainWin.restore();
      mainWin.show();
      mainWin.focus();
      mainWin.webContents.send("open-note-from-link", { noteKey });
    }
    if (importUrl && mainWin) {
      const decodedUrl = decodeURIComponent(importUrl);
      if (mainWin.isMinimized()) mainWin.restore();
      mainWin.show();
      mainWin.focus();
      mainWin.webContents.send("import-url-from-link", { url: decodedUrl });
    }
  } catch (error) {
    console.error("Error handling callback URL:", error);
    console.info("Problematic URL:", url);
  }
};
