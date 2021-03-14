import OtherUtil from "./otherUtil";
import { isElectron } from "react-device-detect";
import localforage from "localforage";
import BookModel from "../model/Book";
const isTitle = (line: string, isSuccess: boolean) => {
  return (
    line.length < 30 &&
    line.indexOf("[") === -1 &&
    line.indexOf("(") === -1 &&
    (line.startsWith("CHAPTER ") ||
      line.startsWith("Chapter ") ||
      line.startsWith("序章") ||
      line.startsWith("前言") ||
      (line.startsWith(isSuccess ? "@" : "*") && line !== "*") ||
      line.startsWith("写在前面的话") ||
      line.startsWith("后记") ||
      line.startsWith("楔子") ||
      line.startsWith("后记") ||
      line.startsWith("后序") ||
      (line.indexOf("第") > -1 && line.indexOf("章") > -1) ||
      (line.indexOf("第") > -1 && line.indexOf("节") > -1) ||
      (line.indexOf("第") > -1 && line.indexOf("回") > -1) ||
      /^[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u5343\u4e07]+$/.test(
        line
      ) ||
      /^\d+$/.test(line))
  );
};
const escapeHTML = (str) => {
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
  return str.replace(regex, function (m) {
    return "&" + escapeChars[m] + ";";
  });
};
class BookUtil {
  static addBook(key: string, buffer: ArrayBuffer) {
    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const dataPath = OtherUtil.getReaderConfig("storageLocation")
        ? OtherUtil.getReaderConfig("storageLocation")
        : window
            .require("electron")
            .ipcRenderer.sendSync("storage-location", "ping");
      return new Promise<void>((resolve, reject) => {
        var reader = new FileReader();
        reader.readAsArrayBuffer(new Blob([buffer]));
        reader.onload = async (event) => {
          try {
            fs.writeFileSync(
              path.join(dataPath, "book", key),
              Buffer.from(event.target!.result as any)
            );
            resolve();
          } catch (error) {
            reject();
            throw error;
          }
        };
        reader.onerror = () => {
          reject();
        };
      });
    } else {
      return localforage.setItem(key, buffer);
    }
  }
  static deleteBook(key: string) {
    if (isElectron) {
      const fs = window.require("fs-extra");
      const path = window.require("path");
      const dataPath = OtherUtil.getReaderConfig("storageLocation")
        ? OtherUtil.getReaderConfig("storageLocation")
        : window
            .require("electron")
            .ipcRenderer.sendSync("storage-location", "ping");
      return new Promise<void>((resolve, reject) => {
        try {
          fs.remove(path.join(dataPath, `book`, key), (err) => {
            if (err) throw err;
            resolve();
          });
        } catch (e) {
          reject();
        }
      });
    } else {
      return localforage.removeItem(key);
    }
  }
  static fetchBook(key: string) {
    if (isElectron) {
      return new Promise<File>((resolve, reject) => {
        var fs = window.require("fs");
        var path = window.require("path");
        var data = fs.readFileSync(
          path.join(
            OtherUtil.getReaderConfig("storageLocation")
              ? OtherUtil.getReaderConfig("storageLocation")
              : window
                  .require("electron")
                  .ipcRenderer.sendSync("storage-location", "ping"),
            `book`,
            key
          )
        );
        let blobTemp = new Blob([data], { type: "application/epub+zip" });
        let fileTemp = new File([blobTemp], "data.epub", {
          lastModified: new Date().getTime(),
          type: blobTemp.type,
        });
        resolve(fileTemp);
      });
    } else {
      return localforage.getItem(key);
    }
  }
  static async RedirectBook(book: BookModel) {
    if (book.description === "pdf") {
      if (isElectron) {
        const file: any = await this.fetchBook(book.key);
        var reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async (event) => {
          await localforage.setItem("pdf", event.target!.result as any);
          window.open(`./lib/pdf/viewer.html?file=pdf`);
        };
      } else {
        window.open(`./lib/pdf/viewer.html?file=${book.key}`);
      }
    } else {
      if (OtherUtil.getReaderConfig("isRememberSize") === "yes") {
        window.open(
          `${window.location.href.split("#")[0]}#/epub/${
            book.key
          }?width=${OtherUtil.getReaderConfig(
            "windowWidth"
          )}&height=${OtherUtil.getReaderConfig(
            "windowHeight"
          )}&x=${OtherUtil.getReaderConfig(
            "windowX"
          )}&y=${OtherUtil.getReaderConfig("windowY")}`
        );
      } else {
        window.open(
          `${window.location.href.split("#")[0]}#/epub/${book.key}?width=full`
        );
      }
    }
  }
  static parseBook(file: any) {
    return new Promise<File | boolean>((resolve, reject) => {
      const fs = window.require("fs");
      const path = window.require("path");
      const chardet = window.require("chardet");
      const { readFileSync } = window.require("fs");
      const iconv = window.require("iconv-lite");
      const nodepub = window.require("nodepub");
      const { remote, app } = window.require("electron");
      const configDir = (app || remote.app).getPath("userData");
      const dirPath = path.join(configDir, "uploads");
      const name = file.name;
      let bookExtension =
        name.indexOf("mobi") > -1
          ? "mobi"
          : name.indexOf("azw3") > -1
          ? "azw3"
          : name.split(".").reverse()[0];
      let bookName = name.substr(
        0,
        name.length - (bookExtension !== "txt" ? 8 : 3) - 1
      );
      var reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = (event) => {
        fs.writeFileSync(
          path.join(dirPath, file.name),
          Buffer.from(event.target!.result as any)
        );
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
          description: "A book generated by Koodo Reader",
          contents: "Content",
          source: "https://koodo.960960.xyz",
          images: [path.join(dirPath, `cover.png`)],
        };

        // Set up the EPUB basics.
        var epub = nodepub.document(metadata, path.join(dirPath, `cover.png`));
        let content: any = [];
        let contentFilter: any = [];
        const analyzeChapter = (isSuccess) => {
          const data = readFileSync(path.join(dirPath, file.name), {
            encoding: "binary",
          });
          const buf = new Buffer(data, "binary");
          const lines = iconv.decode(buf, chardet.detect(buf)).split("\n");
          const lineLength = lines.length;
          const imgIndex = lines.indexOf("~image");
          const images = lines.slice(imgIndex).filter((item) => {
            return item.startsWith("data");
          });
          lines.splice(imgIndex, lineLength - imgIndex);
          for (let i = 0; i < lines.length; i++) {
            const line = escapeHTML(lines[i]).trim();
            if (isTitle(line, isSuccess)) {
              console.log(line);
              content.push({
                title: line.startsWith("*") ? line.substr(1) : line,
                data: "",
              });
            } else if (line) {
              if (!content[content.length - 1]) {
                content.push({
                  title: "Forward",
                  data: "",
                });
              }
              if (line === "#image") {
                if (images.length > 0) {
                  content[content.length - 1].data += `<img src="${
                    images[0].split(" ")[0]
                  }" style="margin-left: calc(50% - ${
                    // eslint-disable-next-line
                    parseInt(images[0].split(" ")[1]) / 2 + "" + "px"
                  })"  width="${images[0].split(" ")[1]}px"  height="${
                    images[0].split(" ")[2]
                  }px"/>`;
                  images.shift();
                } else {
                  content[content.length - 1].data += `<img src=" "/>`;
                }
              } else if (!line.startsWith("*")) {
                content[
                  content.length - 1
                ].data += `<p style="text-indent:2em">${line}</p>`;
              }
            }
          }
          contentFilter = content.filter((item) => {
            return item.data.trim() && item.data.trim().length > 50;
          });
        };
        analyzeChapter(true);
        if (contentFilter.length < 7) {
          content = [];
          contentFilter = [];
          analyzeChapter(false);
        }
        for (let i = 0; i < contentFilter.length; i++) {
          epub.addSection(
            contentFilter[i].title,
            `<h1>${contentFilter[i].title}</h1>` + contentFilter[i].data
          );
        }
        epub.writeEPUB(
          function (e) {
            console.log("Error:", e);
            reject(false);
          },
          dirPath,
          bookName,
          function () {
            var data = fs.readFileSync(path.join(dirPath, `${bookName}.epub`));
            let blobTemp = new Blob([data], { type: "application/epub+zip" });
            let fileTemp = new File([blobTemp], `${bookName}.epub`, {
              lastModified: new Date().getTime(),
              type: blobTemp.type,
            });
            try {
              const fs = window.require("fs-extra");
              fs.remove(path.join(dirPath, `${bookName}.epub`), (err) => {
                if (err) throw err;
                console.log("successfully epub deleted");
              });
              fs.remove(path.join(dirPath, file.name), (err) => {
                if (err) throw err;
                console.log("successfully file deleted");
              });

              resolve(fileTemp);
            } catch (e) {
              console.log("error removing ");
              reject(false);
            }
          }
        );
      };
    });
  }
}

export default BookUtil;
