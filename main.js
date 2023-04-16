const {
  app,
  BrowserWindow,
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
const { randomBytes } = require("crypto");
const { WebSocket } = require("ws");
const dirPath = path.join(configDir, "uploads");
let mainWin;
let readerWindow;
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
  ipcMain.handle("open-book", (event, config) => {
    let { url, isMergeWord, isFullscreen, isPreventSleep } = config;
    options.webPreferences.nodeIntegrationInSubFrames = true;
    store.set({
      url,
      isMergeWord: isMergeWord ? isMergeWord : "no",
      isFullscreen: isFullscreen ? isFullscreen : "no",
      isPreventSleep: isPreventSleep ? isPreventSleep : "no",
    });
    let id;
    if (isPreventSleep === "yes") {
      id = powerSaveBlocker.start("prevent-display-sleep");
      console.log(powerSaveBlocker.isStarted(id));
    }

    if (isFullscreen === "yes") {
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
  ipcMain.handle("edge-tts", async (event, config) => {
    let { text } = config;
    return await ra(text);
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

const FORMAT_CONTENT_TYPE = new Map([
  ["raw-16khz-16bit-mono-pcm", "audio/basic"],
  ["raw-48khz-16bit-mono-pcm", "audio/basic"],
  ["raw-8khz-8bit-mono-mulaw", "audio/basic"],
  ["raw-8khz-8bit-mono-alaw", "audio/basic"],

  ["raw-16khz-16bit-mono-truesilk", "audio/SILK"],
  ["raw-24khz-16bit-mono-truesilk", "audio/SILK"],

  ["riff-16khz-16bit-mono-pcm", "audio/x-wav"],
  ["riff-24khz-16bit-mono-pcm", "audio/x-wav"],
  ["riff-48khz-16bit-mono-pcm", "audio/x-wav"],
  ["riff-8khz-8bit-mono-mulaw", "audio/x-wav"],
  ["riff-8khz-8bit-mono-alaw", "audio/x-wav"],

  ["audio-16khz-32kbitrate-mono-mp3", "audio/mpeg"],
  ["audio-16khz-64kbitrate-mono-mp3", "audio/mpeg"],
  ["audio-16khz-128kbitrate-mono-mp3", "audio/mpeg"],
  ["audio-24khz-48kbitrate-mono-mp3", "audio/mpeg"],
  ["audio-24khz-96kbitrate-mono-mp3", "audio/mpeg"],
  ["audio-24khz-160kbitrate-mono-mp3", "audio/mpeg"],
  ["audio-48khz-96kbitrate-mono-mp3", "audio/mpeg"],
  ["audio-48khz-192kbitrate-mono-mp3", "audio/mpeg"],

  ["webm-16khz-16bit-mono-opus", "audio/webm; codec=opus"],
  ["webm-24khz-16bit-mono-opus", "audio/webm; codec=opus"],

  ["ogg-16khz-16bit-mono-opus", "audio/ogg; codecs=opus; rate=16000"],
  ["ogg-24khz-16bit-mono-opus", "audio/ogg; codecs=opus; rate=24000"],
  ["ogg-48khz-16bit-mono-opus", "audio/ogg; codecs=opus; rate=48000"],
]);

class Service {
  ws = null;

  executorMap;
  bufferMap;

  timer = null;

  constructor() {
    this.executorMap = new Map();
    this.bufferMap = new Map();
  }

  async connect() {
    const connectionId = randomBytes(16).toString("hex").toLowerCase();
    let url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=${connectionId}`;
    console.log(url);
    let ws = new WebSocket(url, {
      host: "speech.platform.bing.com",
      origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.66 Safari/537.36 Edg/103.0.1264.44",
      },
    });
    console.log(ws);
    return new Promise((resolve, reject) => {
      ws.on("open", () => {
        resolve(ws);
      });
      ws.on("close", (code, reason) => {
        // 服务器会自动断开空闲超过30秒的连接
        this.ws = null;
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        for (let [key, value] of this.executorMap) {
          value.reject(`连接已关闭: ${reason} ${code}`);
        }
        this.executorMap.clear();
        this.bufferMap.clear();
        console.info(`连接已关闭： ${reason} ${code}`);
      });

      ws.on("message", (message, isBinary) => {
        let pattern = /X-RequestId:(?<id>[a-z|0-9]*)/;
        if (!isBinary) {
          console.debug("收到文本消息：%s", message);
          let data = message.toString();
          if (data.includes("Path:turn.start")) {
            // 开始传输
            let matches = data.match(pattern);
            let requestId = matches.groups.id;
            console.debug(`开始传输：${requestId}……`);
            this.bufferMap.set(requestId, Buffer.from([]));
          } else if (data.includes("Path:turn.end")) {
            // 结束传输
            let matches = data.match(pattern);
            let requestId = matches.groups.id;

            let executor = this.executorMap.get(requestId);
            if (executor) {
              this.executorMap.delete(matches.groups.id);
              let result = this.bufferMap.get(requestId);
              executor.resolve(result);
              console.debug(`传输完成：${requestId}……`);
            } else {
              console.debug(`请求已被丢弃：${requestId}`);
            }
          }
        } else if (isBinary) {
          let separator = "Path:audio\r\n";
          let data = message;
          let contentIndex = data.indexOf(separator) + separator.length;

          let headers = data.slice(2, contentIndex).toString();
          let matches = headers.match(pattern);
          let requestId = matches.groups.id;

          let content = data.slice(contentIndex);

          console.debug(
            `收到音频片段：${requestId} Length: ${content.length}\n${headers}`
          );

          let buffer = this.bufferMap.get(requestId);
          if (buffer) {
            buffer = Buffer.concat([buffer, content]);
            this.bufferMap.set(requestId, buffer);
          } else {
            console.debug(`请求已被丢弃：${requestId}`);
          }
        }
      });
      ws.on("error", (error) => {
        console.error(`连接失败： ${error}`);
        reject(`连接失败： ${error}`);
      });
      ws.on("ping", (data) => {
        console.debug("ping %s", data);
      });
      ws.on("pong", (data) => {
        console.debug("pong %s", data);
      });
    });
  }

  async convert(ssml, format) {
    if (this.ws == null || this.ws.readyState != WebSocket.OPEN) {
      console.info("准备连接服务器……");
      let connection = await this.connect();
      this.ws = connection;
      console.info("连接成功！");
    }
    const requestId = randomBytes(16).toString("hex").toLowerCase();
    let result = new Promise((resolve, reject) => {
      // 等待服务器返回后这个方法才会返回结果
      this.executorMap.set(requestId, {
        resolve,
        reject,
      });
      // 发送配置消息
      let configData = {
        context: {
          synthesis: {
            audio: {
              metadataoptions: {
                sentenceBoundaryEnabled: "false",
                wordBoundaryEnabled: "false",
              },
              outputFormat: format,
            },
          },
        },
      };
      let configMessage =
        `X-Timestamp:${Date()}\r\n` +
        "Content-Type:application/json; charset=utf-8\r\n" +
        "Path:speech.config\r\n\r\n" +
        JSON.stringify(configData);
      console.info(`开始转换：${requestId}……`);
      console.debug(`准备发送配置请求：${requestId}\n`, configMessage);
      this.ws.send(configMessage, (configError) => {
        if (configError) {
          console.error(`配置请求发送失败：${requestId}\n`, configError);
        }

        // 发送SSML消息
        let ssmlMessage =
          `X-Timestamp:${Date()}\r\n` +
          `X-RequestId:${requestId}\r\n` +
          `Content-Type:application/ssml+xml\r\n` +
          `Path:ssml\r\n\r\n` +
          ssml;
        console.debug(`准备发送SSML消息：${requestId}\n`, ssmlMessage);
        this.ws.send(ssmlMessage, (ssmlError) => {
          if (ssmlError) {
            console.error(`SSML消息发送失败：${requestId}\n`, ssmlError);
          }
        });
      });
    });

    // 收到请求，清除超时定时器
    if (this.timer) {
      console.debug("收到新的请求，清除超时定时器");
      clearTimeout(this.timer);
    }
    // 设置定时器，超过10秒没有收到请求，主动断开连接
    console.debug("创建新的超时定时器");
    this.timer = setTimeout(() => {
      if (this.ws && this.ws.readyState == WebSocket.OPEN) {
        console.debug("已经 10 秒没有请求，主动关闭连接");
        this.ws.close(1000);
        this.timer = null;
      }
    }, 10000);

    let data = await Promise.race([
      result,
      new Promise((resolve, reject) => {
        // 如果超过 20 秒没有返回结果，则清除请求并返回超时
        setTimeout(() => {
          this.executorMap.delete(requestId);
          this.bufferMap.delete(requestId);
          reject("转换超时");
        }, 10000);
      }),
    ]);
    console.info(`转换完成：${requestId}`);
    console.info(`剩余 ${this.executorMap.size} 个任务`);
    return data;
  }
}

const service = new Service();
const retry = async function (fn, times, errorFn, failedMessage) {
  let reason = {
    message: failedMessage ?? "多次尝试后失败",
    errors: [],
  };
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (error) {
      if (errorFn) {
        errorFn(i, error);
      }
      reason.errors.push(error);
    }
  }
  throw reason;
};
const ra = async (text) => {
  console.debug(`请求正文：${text}`);
  try {
    let format = "webm-24khz-16bit-mono-opus";
    if (Array.isArray(format)) {
      throw `无效的音频格式：${format}`;
    }
    if (!FORMAT_CONTENT_TYPE.has(format)) {
      throw `无效的音频格式：${format}`;
    }

    let ssml = text;
    if (ssml == null) {
      throw `转换参数无效`;
    }
    let result = await retry(
      async () => {
        let result = await service.convert(ssml, format);
        return result;
      },
      3,
      (index, error) => {
        console.warn(`第${index}次转换失败：${error}`);
      },
      "服务器多次尝试后转换失败"
    );
    return result;
    // response.sendDate = true;
    // response
    //   .status(200)
    //   .setHeader("Content-Type", FORMAT_CONTENT_TYPE.get(format));
    // response.end(result);
  } catch (error) {
    console.error(`发生错误, ${error.message}`);
    // response.status(503).json(error);
  }
};

// ra(
//   `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">          <voice name="zh-CN-XiaoxiaoNeural"><prosody rate="0%" pitch="0%">如果喜欢这个项目的话请点个 Star 吧。</prosody ></voice > </speak >`
// );
