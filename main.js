const { app, BrowserWindow, ipcMain, screen, dialog } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
const fontList = require("font-list");
const chardet = require("chardet");
const detect = require("detect-port");
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
    alwaysOnTop: isDev ? false : true,
  });
  splash.loadURL(
    isDev
      ? path.join(__dirname, "/public/assets/launch-page.html")
      : `file://${path.join(__dirname, "./build/assets/launch-page.html")}`
  );
  if (!isDev) {
    const { Menu } = require("electron");
    Menu.setApplicationMenu(null);
  }

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
  // mainWin.webContents.on(
  //   "new-window",
  //   (event, url, frameName, disposition, options, additionalFeatures) => {
  //     event.preventDefault();
  //     Object.assign(options, {
  //       parent: mainWin,
  //       width: width,
  //       height: height,
  //     });
  //     event.newGuest = new BrowserWindow(options);
  //     event.newGuest.maximize();
  //   }
  // );
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
  ipcMain.on("start-server", (event, arg) => {
    startExpress();
    event.returnValue = "pong";
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
function startExpress() {
  const express = require("express");
  const cors = require("cors");
  const bodyParser = require("body-parser");
  const fileUpload = require("express-fileupload");
  const path = require("path");
  const fs = require("fs");
  const { readFileSync } = require("fs");
  const iconv = require("iconv-lite");
  const electron = require("electron");
  const nodepub = require("nodepub");
  const request = require("request");
  const configDir = (electron.app || electron.remote.app).getPath("userData");
  var dirPath = path.join(configDir, "uploads\\");
  detect(port)
    .then(async (_port) => {
      if (port == _port) {
        console.log(`port: ${port} was not occupied`);
      } else {
        dialog.showMessageBox({
          type: "warning",
          title: `Port 3366 is in use`,
          message: `Don't open multiple Koodo Reader at the same time`,
        });
        console.log(`port: ${port} was occupied, try port: ${_port}`);
        return;
      }
    })
    .catch((err) => {
      console.log(err);
      dialog.showErrorBox("Error Message", err);
      return;
    });
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
    console.log("文件夹创建成功");
  } else {
    console.log("文件夹已存在");
  }
  var escapeChars = {
    "¢": "cent",
    "£": "pound",
    "¥": "yen",
    "€": "euro",
    "©": "copy",
    "®": "reg",
    "<": "lt",
    ">": "gt",
    '"': "quot",
    "&": "amp",
    "'": "#39",
  };

  var regexString = "[";
  for (var key in escapeChars) {
    regexString += key;
  }
  regexString += "]";

  var regex = new RegExp(regexString, "g");

  function escapeHTML(str) {
    return str.replace(regex, function (m) {
      return "&" + escapeChars[m] + ";";
    });
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
  if (!fs.existsSync(dirPath + `/cover-0.jpg`)) {
    for (let i = 0; i < 5; i++) {
      let stream = fs.createWriteStream(dirPath + `/cover-${i}.jpg`);
      request(`https://koodo.960960.xyz/images/cover-${i}.jpg`)
        .pipe(stream)
        .on("close", function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("文件下载完毕");
          }
        });
    }
  }

  server.post("/ebook_parser", async (req, res) => {
    let file = req.files.file;
    let bookTitle = file.name.split(".")[0];
    let id = Math.floor(Math.random() * 5);
    file.mv(dirPath + `/${file.name}`, () => {
      var metadata = {
        id: new Date().getTime(),
        title: bookTitle,
        author: "Unknown Authur",
        fileAs: "Anonymous",
        genre: "Non-Fiction",
        tags: "Sample,Example,Test",
        copyright: "Anonymous, 2020",
        publisher: "My Fake Publisher",
        published: new Date().toLocaleDateString(),
        language: "cn",
        description: "A book generated by nodepub",
        contents: "目录",
        source: "https://koodo.960960.xyz",
        images: [dirPath + `/cover-${id}.jpg`],
      };

      // Set up the EPUB basics.
      var epub = nodepub.document(metadata, dirPath + `/cover-${id}.jpg`);
      const data = readFileSync(dirPath + `/${file.name}`, {
        encoding: "binary",
      });
      const buf = new Buffer(data, "binary");
      const lines = iconv.decode(buf, chardet.detect(buf)).split("\n");
      const content = [];
      for (let i = 0; i < lines.length; i++) {
        const line = escapeHTML(lines[i]);
        if (
          line.length < 30 &&
          line.indexOf("。") === -1 &&
          line.indexOf(".") === -1 &&
          line.indexOf("！") === -1 &&
          line.indexOf("：") === -1 &&
          line.indexOf("，") === -1 &&
          line.indexOf("第一天") === -1 &&
          line.indexOf("第二天") === -1 &&
          (line.startsWith("CHAPTER ") ||
            line.startsWith("Chapter ") ||
            line.startsWith("第") ||
            line.startsWith("序章") ||
            line.startsWith("前言") ||
            line.startsWith("写在前面的话") ||
            line.startsWith("后记") ||
            line.startsWith("楔子") ||
            line.startsWith("后记") ||
            line.startsWith("后序") ||
            /^[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u5343\u4e07]+$/.test(
              line
            ) ||
            /^\d+$/.test(line))
        ) {
          content.push({
            title: line,
            data: "",
          });
        } else if (line.trim()) {
          if (!content[content.length - 1]) {
            content.push({
              title: "前言",
              data: "",
            });
          }
          content[
            content.length - 1
          ].data += `<p style="text-indent:2em">${line.trim()}</p>`;
        }
      }
      for (let i = 0; i < content.length; i++) {
        content[i].data.trim() &&
          content[i].data.trim().length > 50 &&
          epub.addSection(
            content[i].title,
            `<h1>${content[i].title}</h1>` + content[i].data
          );
      }

      // Generate the result.
      epub.writeEPUB(
        function (e) {
          console.log("Error:", e);
          res.send("失败了");
        },
        dirPath,
        bookTitle,
        function () {
          res.sendFile(dirPath + `/${bookTitle}.epub`);
          res.on("finish", function () {
            try {
              fs.unlink(dirPath + `${bookTitle}.epub`, (err) => {
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
        }
      );
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
  const port = 3366;

  startServer();
}
