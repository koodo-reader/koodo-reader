const { app, BrowserWindow, ipcMain, screen } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
const fontList = require("font-list");

let mainWin;
let splash;

app.disableHardwareAcceleration();
app.on("ready", () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWin = new BrowserWindow({
    titleBarStyle: "hidden",
    width: 1030,
    height: 660,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      nativeWindowOpen: true,
      nodeIntegrationInSubFrames: true,
      allowRunningInsecureContent: true,
    },
    show: false,
    // transparent: true,
  });
  splash = new BrowserWindow({
    width: 530,
    height: 343,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
  });
  splash.loadURL(
    isDev
      ? path.join(__dirname, "/public/assets/launch-page.html")
      : `file://${path.join(__dirname, "./build/assets/launch-page.html")}`
  );
  // if (!isDev) {
  //   const { Menu } = require("electron");
  //   Menu.setApplicationMenu(null);
  // }

  const urlLocation = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "./build/index.html")}`;
  mainWin.loadURL(urlLocation);
  mainWin.webContents.on("did-finish-load", () => {
    splash.destroy();
    // mainWin.maximize();
    // mainWin.webContents.setZoomFactor(1);
    mainWin.show();
  });
  mainWin.on("close", () => {
    mainWin = null;
  });
  mainWin.webContents.on(
    "new-window",
    (event, url, frameName, disposition, options, additionalFeatures) => {
      event.preventDefault();
      Object.assign(options, {
        parent: mainWin,
        width: width,
        height: height,
        frame: url.indexOf("epub") > -1 ? true : true,
      });
      event.newGuest = new BrowserWindow(options);
      event.newGuest.maximize();
    }
  );
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
  let isFirst = true;
  ipcMain.on("start-server", (event, arg) => {
    if (isFirst) startExpress();
    isFirst = false;
    event.returnValue = "pong";
  });
});
app.on("window-all-closed", () => {
  app.quit();
});
function startExpress() {
  const express = require("express");
  const cors = require("cors");
  const bodyParser = require("body-parser");
  const fileUpload = require("express-fileupload");
  const path = require("path");
  const fs = require("fs");
  const Epub = require("epub-gen");
  const { readFileSync } = require("fs");
  const iconv = require("iconv-lite");
  const electron = require("electron");
  const configDir = (electron.app || electron.remote.app).getPath("userData");
  var dirPath = path.join(configDir, "uploads");
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
    console.log("文件夹创建成功");
  } else {
    console.log("文件夹已存在");
  }
  const server = express();
  server.use(
    fileUpload({
      createParentPath: true,
    })
  );
  server.use(cors());
  server.use(bodyParser.json());
  server.use(bodyParser.urlencoded({ extended: true }));
  server.post("/ebook_parser", async (req, res) => {
    let file = req.files.file;
    file.mv(dirPath + file.name, () => {
      const data = readFileSync(dirPath + file.name, {
        encoding: "binary",
      });
      const buf = new Buffer(data, "binary");
      const lines = iconv.decode(buf, "GBK").split("\n");
      const content = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // console.log(line, line.startsWith("序章"), "test");

        if (
          line.startsWith("CHAPTER ") ||
          line.startsWith("Chapter") ||
          line.startsWith("第") ||
          line.startsWith("序章") ||
          line.startsWith("前言") ||
          line.startsWith("写在前面的话") ||
          line.startsWith("后记") ||
          line.startsWith("楔子") ||
          line.startsWith("后记") ||
          line.startsWith("后序")
        ) {
          if (content.length) {
            content[content.length - 1].data = content[
              content.length - 1
            ].data.join("\n");
          }
          content.push({
            data: [],
          });
        } else if (line.trim() === "" && content.length) {
          if (content[content.length - 1].data.length > 1) {
            content[content.length - 1].data.push("</p>");
          }
          content[content.length - 1].data.push("<p style='text-indent:2em'>");
        } else if (content.length) {
          content[content.length - 1].data.push(line.trim());
        }
        if (
          content[content.length - 1] &&
          content[content.length - 1].data &&
          i === lines.length - 1
        ) {
          content[content.length - 1].data = content[
            content.length - 1
          ].data.join("\n");
        }
      }
      if (!content.length) {
        content.push({
          title: "正文",
          data: lines
            .map((item) => {
              return `<p>${item}</p>`;
            })
            .join("\n"),
        });
      }
      const options = {
        title: file.name.split(".")[0],
        author: "Koodo Reader",
        output: dirPath + `${file.name.split(".")[0]}.epub`,
        content,
      };
      new Epub(options).promise
        .then(() => {
          res.sendFile(dirPath + `${file.name.split(".")[0]}.epub`);
          res.on("finish", function () {
            try {
              fs.unlink(dirPath + `${file.name.split(".")[0]}.epub`, (err) => {
                if (err) throw err;
                console.log("successfully deleted");
              });
              fs.unlink(dirPath + `${file.name}`, (err) => {
                if (err) throw err;
                console.log("successfully deleted");
              });
            } catch (e) {
              console.log("error removing ");
            }
          });
        })
        .catch((err) => console.log("err"));
    });
  });

  async function start() {
    try {
      const port = 3366;
      expressServer = await server.listen(port);
      console.log("started");
      const address = expressServer.address();
      serverInfo = {
        port: address.port,
        local: "localhost",
        url: `http://localhost:${address.port}`,
      };
      return serverInfo;
    } catch (e) {
      return { message: e.message };
    }
  }

  async function startServer() {
    console.log("starting");
    const { port, local, message } = await start();
    if (message) {
      console.log("err");
      console.error(message);
    } else {
      console.info(`启动成功，本地访问 http://${local}:${port}`);
    }
  }

  startServer();
}
