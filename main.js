const { app, BrowserWindow, ipcMain, screen, dialog } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
const fontList = require("font-list");
const detect = require("detect-port");
let mainWin;
let splash;
app.disableHardwareAcceleration();
const port = 3366;

app.on("ready", () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  detect(port, (err, _port) => {
    if (port == _port) {
      console.log("port is availible");
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
      mainWin.webContents.on(
        "new-window",
        (event, url, frameName, disposition, options, additionalFeatures) => {
          event.preventDefault();
          Object.assign(options, {
            parent: mainWin,
            width: width,
            height: height,
          });
          event.newGuest = new BrowserWindow(options);
          event.newGuest.maximize();
        }
      );
      mainWin.on("close", () => {
        mainWin = null;
      });
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
    } else {
      dialog.showMessageBox({
        type: "warning",
        title: "Warning",
        message: "Another Koodo Reader is already running",
      });
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
const startExpress = () => {
  const express = require("express");
  const cors = require("cors");
  const bodyParser = require("body-parser");
  const fileUpload = require("express-fileupload");
  const path = require("path");
  const fs = require("fs");
  const chardet = require("chardet");
  const { readFileSync } = require("fs");
  const iconv = require("iconv-lite");
  const electron = require("electron");
  const nodepub = require("nodepub");
  const request = require("request");
  const { createClient } = require("webdav");
  const configDir = (electron.app || electron.remote.app).getPath("userData");
  var dirPath = path.join(configDir, "uploads\\");

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
    let bookName = file.name.split(".")[0];
    let bookExtension = file.name.split(".")[1];

    let id = Math.floor(Math.random() * 5);
    file.mv(dirPath + `/${file.name}`, () => {
      var metadata = {
        id: new Date().getTime(),
        title: bookName,
        author: "Unknown Authur",
        fileAs: "Anonymous",
        genre: "Non-Fiction",
        tags: "Sample,Example,Test",
        copyright: "Anonymous, 2020",
        publisher: bookExtension,
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
      const lineLength = lines.length;
      const imgIndex = lines.indexOf("~image");
      const content = [];
      const images = lines.slice(imgIndex).filter((item) => {
        return item.startsWith("data");
      });
      lines.splice(imgIndex, lineLength - imgIndex);
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
          if (line.trim() === "#image") {
            content[content.length - 1].data += `<img src="${images[0]}" />`;
            images.shift();
          } else {
            content[
              content.length - 1
            ].data += `<p style="text-indent:2em">${line.trim()}</p>`;
          }
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
      epub.writeEPUB(
        function (e) {
          console.log("Error:", e);
          res.send("失败了");
        },
        dirPath,
        bookName,
        function () {
          res.sendFile(dirPath + `/${bookName}.epub`);
          res.on("finish", function () {
            try {
              fs.unlink(dirPath + `/${bookName}.epub`, (err) => {
                if (err) throw err;
                console.log("successfully epub deleted");
              });
              fs.unlink(dirPath + `/${file.name}`, (err) => {
                if (err) throw err;
                console.log("successfully file deleted");
              });
            } catch (e) {
              console.log("error removing ");
            }
          });
        }
      );
    });
  });
  server.post("/webdav_upload", async (req, res) => {
    const { file } = req.files;
    const { url, username, password } = req.body;
    const client = createClient(url, {
      username,
      password,
    });
    file.mv(dirPath + `/${file.name}`, async () => {
      if ((await client.exists("/KoodoReader")) === false) {
        await client.createDirectory("/KoodoReader");
      }

      let stream = client.createWriteStream("/KoodoReader/data.zip", {}, () => {
        fs.unlink(dirPath + `/${file.name}`, (err) => {
          if (err) throw err;
          console.log("successfully data deleted");
        });
        res.send("success");
      });
      fs.createReadStream(dirPath + `/${file.name}`).pipe(stream);
    });
  });
  server.post("/webdav_download", async (req, res) => {
    const { url, username, password } = req.body;
    const client = createClient(url, {
      username,
      password,
    });
    console.log(await client.exists("/KoodoReader/data.zip"));
    if ((await client.exists("/KoodoReader/data.zip")) === false) {
      res.send("error");
    }
    let stream = fs.createWriteStream(dirPath + `/data.zip`);
    client.createReadStream("/KoodoReader/data.zip").pipe(stream);
    stream.on("close", () => {
      res.sendFile(dirPath + `/data.zip`, function () {
        try {
          fs.unlink(dirPath + `/data.zip`);
        } catch (e) {
          console.log("error removing ", dirPath + `/data.zip`);
        }
      });
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
};
