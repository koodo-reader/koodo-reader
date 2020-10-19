//从本地导入书籍
import React from "react";
import "./importLocal.css";
import BookModel from "../../model/Book";
import localforage from "localforage";
import SparkMD5 from "spark-md5";
import { Trans } from "react-i18next";
import Dropzone from "react-dropzone";
import { ImportLocalProps, ImportLocalState } from "./interface";
import RecordRecent from "../../utils/recordRecent";
import axios from "axios";
import { config } from "../../constants/readerConfig";
import MobiFile from "../../utils/mobiUtil";
import iconv from "iconv-lite";
import isElectron from "is-electron";
import { withRouter } from "react-router-dom";

declare var window: any;
var pdfjsLib = window["pdfjs-dist/build/pdf"];

class ImportLocal extends React.Component<ImportLocalProps, ImportLocalState> {
  componentDidMount() {
    if (isElectron()) {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.sendSync("start-server", "ping");
    }
  }
  handleAddBook = (book: BookModel) => {
    return new Promise((resolve, reject) => {
      let bookArr = this.props.books;
      if (bookArr == null) {
        bookArr = [];
      }
      bookArr.push(book);
      RecordRecent.setRecent(book.key);
      localforage
        .setItem("books", bookArr)
        .then(() => {
          this.props.handleFetchBooks();
          this.props.handleMessage("Add Successfully");
          this.props.handleMessageBox(true);
          resolve();
          this.props.history.push("/manager/home");
        })
        .catch(() => {
          reject();
        });
    });
  };
  //获取书籍md5
  doIncrementalTest = (file: any) => {
    return new Promise((resolve, reject) => {
      //这里假设直接将文件选择框的dom引用传入
      //这里需要用到File的slice( )方法，以下是兼容写法

      var blobSlice =
          (File as any).prototype.slice ||
          (File as any).prototype.mozSlice ||
          (File as any).prototype.webkitSlice,
        chunkSize = 2097152, // 以每片2MB大小来逐次读取
        chunks = Math.ceil(file.size / chunkSize),
        currentChunk = 0,
        spark = new SparkMD5(), //创建SparkMD5的实例
        fileReader = new FileReader();

      fileReader.onload = async (e) => {
        if (!e.target) {
          reject();
          throw new Error();
        }
        spark.appendBinary(e.target.result as any); // append array buffer
        currentChunk += 1;
        if (currentChunk < chunks) {
          loadNext();
        } else {
          let md5 = spark.end(); // 完成计算，返回结果
          await this.handleBook(file, md5);
          resolve();
        }
      };

      const loadNext = () => {
        var start = currentChunk * chunkSize,
          end = start + chunkSize >= file.size ? file.size : start + chunkSize;

        fileReader.readAsBinaryString(blobSlice.call(file, start, end));
      };

      loadNext();
    });
  };
  handleBook = (file: any, md5: string) => {
    let extension = file.name.split(".")[file.name.split(".").length - 1];
    return new Promise((resolve, reject) => {
      //md5重复不导入
      let isRepeat = false;
      if (this.props.books) {
        this.props.books.forEach((item) => {
          if (item.md5 === md5) {
            isRepeat = true;
            this.props.handleMessage("Duplicate Book");
            this.props.handleMessageBox(true);
            resolve();
          }
        });
      }
      //解析图书，获取图书数据
      if (!isRepeat) {
        let reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async (e) => {
          if (!e.target) {
            this.props.handleMessage("Import Failed");
            this.props.handleMessageBox(true);
            reject();
            throw new Error();
          }
          if (extension === "pdf") {
            if (!e.target) {
              reject();
              throw new Error();
            }
            pdfjsLib
              .getDocument({ data: e.target.result })
              .promise.then((pdfDoc_: any) => {
                let pdfDoc = pdfDoc_;
                pdfDoc.getMetadata().then((metadata: any) => {
                  pdfDoc.getPage(1).then((page: any) => {
                    var scale = 1.5;
                    var viewport = page.getViewport({
                      scale: scale,
                    });
                    var canvas: any = document.getElementById("the-canvas");
                    var context = canvas.getContext("2d");
                    canvas.height =
                      viewport.height ||
                      viewport.viewBox[3]; /* viewport.height is NaN */
                    canvas.width =
                      viewport.width ||
                      viewport.viewBox[2]; /* viewport.width is also NaN */
                    var task = page.render({
                      canvasContext: context,
                      viewport: viewport,
                    });
                    task.promise.then(async () => {
                      let cover: any = canvas.toDataURL("image/jpeg");
                      let key: string,
                        name: string,
                        author: string,
                        description: string;
                      [name, author, description] = [
                        metadata.info.Title || file.name,
                        metadata.info.Author,
                        "pdf",
                      ];
                      key = new Date().getTime() + "";
                      let book = new BookModel(
                        key,
                        name,
                        author,
                        description,
                        md5,
                        cover
                      );
                      await this.handleAddBook(book);
                      localforage.setItem(key, e.target!.result);
                      resolve();
                    });
                  });
                });
              })
              .catch((err: any) => {
                this.props.handleMessage("Import Failed");
                this.props.handleMessageBox(true);
                console.log("Error occurs");
                reject();
              });
          } else if (extension === "mobi") {
            if (!isElectron()) {
              this.props.handleMessage("Only Desktop support this format");
              this.props.handleMessageBox(true);
              console.log("Error occurs");
              reject();
              return;
            }
            var reader = new FileReader();
            reader.onload = (event) => {
              const file_content = (event.target as any).result;
              let mobiFile = new MobiFile(file_content);

              let content = mobiFile.render();
              let buf = iconv.encode(content, "GBK");
              let blobTemp: any = new Blob([buf], { type: "text/plain" });
              let fileTemp = new File(
                [blobTemp],
                file.name.split(".")[0] + ".txt",
                {
                  lastModified: new Date().getTime(),
                  type: blobTemp.type,
                }
              );

              this.doIncrementalTest(fileTemp);
            };
            reader.readAsArrayBuffer(file);
          } else if (extension === "txt") {
            if (!isElectron()) {
              this.props.handleMessage("Only Desktop support this format");
              this.props.handleMessageBox(true);
              console.log("Error occurs");
              reject();
              return;
            }
            let formData = new FormData();
            formData.append("file", file);
            axios
              .post(`${config.token_url}/ebook_parser`, formData, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
                responseType: "blob",
              })
              .then((res) => {
                let type = "application/octet-stream";
                let blobTemp: any = new Blob([res.data], { type: type });
                let fileTemp = new File(
                  [blobTemp],
                  file.name.split(".")[0] + ".epub",
                  {
                    lastModified: new Date().getTime(),
                    type: blobTemp.type,
                  }
                );

                this.doIncrementalTest(fileTemp);
              })
              .catch((err) => {
                this.props.handleMessage("Import Failed");
                this.props.handleMessageBox(true);
                console.log(err, "Error occurs");
                reject();
              });
          } else {
            let cover: any = "";
            const epub = window.ePub(e.target.result);
            epub.loaded.metadata
              .then((metadata: any) => {
                if (!e.target) {
                  reject();
                  throw new Error();
                }
                epub
                  .coverUrl()
                  .then(async (url: string) => {
                    if (url) {
                      var reader = new FileReader();
                      let blob = await fetch(url).then((r) => r.blob());
                      reader.readAsDataURL(blob);
                      reader.onloadend = async () => {
                        cover = reader.result;
                        let key: string,
                          name: string,
                          author: string,
                          description: string;
                        [name, author, description] = [
                          metadata.title,
                          metadata.creator,
                          metadata.description,
                        ];
                        key = new Date().getTime() + "";
                        let book = new BookModel(
                          key,
                          name,
                          author,
                          description,
                          md5,
                          cover
                        );
                        await this.handleAddBook(book);
                        localforage.setItem(key, e.target!.result);
                        resolve();
                      };
                    } else {
                      cover = "noCover";
                      let key: string,
                        name: string,
                        author: string,
                        description: string;
                      [name, author, description] = [
                        metadata.title,
                        metadata.creator,
                        metadata.description,
                      ];
                      key = new Date().getTime() + "";
                      let book = new BookModel(
                        key,
                        name,
                        author,
                        description,
                        md5,
                        cover
                      );
                      await this.handleAddBook(book);
                      localforage.setItem(key, e.target!.result);
                      resolve();
                    }
                  })
                  .catch((err: any) => {
                    console.log(err, "err");
                    reject();
                  });
              })
              .catch(() => {
                this.props.handleMessage("Import Failed");
                this.props.handleMessageBox(true);
                console.log("Error occurs");
                reject();
              });
          }
        };
      }
    });
  };

  render() {
    return (
      <Dropzone
        onDrop={async (acceptedFiles) => {
          if (acceptedFiles.length > 9) {
            this.props.handleMessage("Please import less than 10 books");
            this.props.handleMessageBox(true);
            return;
          }

          for (let i = 0; i < acceptedFiles.length; i++) {
            //异步解析文件
            await this.doIncrementalTest(acceptedFiles[i]);
          }
        }}
        accept={[".epub", ".pdf", ".txt", ".mobi"]}
        multiple={true}
      >
        {({ getRootProps, getInputProps }) => (
          <div className="import-from-local" {...getRootProps()}>
            <Trans>Import from Local</Trans>
            <input
              type="file"
              id="import-book-box"
              className="import-book-box"
              name="file"
              {...getInputProps()}
            />
          </div>
        )}
      </Dropzone>
    );
  }
}

export default withRouter(ImportLocal);
