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
import { config } from "../../constants/driveList";
import MobiFile from "../../utils/mobiUtil";
import iconv from "iconv-lite";
import isElectron from "is-electron";
import { withRouter } from "react-router-dom";
import RecentBooks from "../../utils/recordRecent";
import OtherUtil from "../../utils/otherUtil";

declare var window: any;
var pdfjsLib = window["pdfjs-dist/build/pdf"];

class ImportLocal extends React.Component<ImportLocalProps, ImportLocalState> {
  constructor(props: ImportLocalProps) {
    super(props);
    this.state = {
      isOpenFile: false,
    };
  }
  componentDidMount() {
    if (isElectron()) {
      const { ipcRenderer } = window.require("electron");
      let result = ipcRenderer.sendSync("start-server", "ping");
      if (!OtherUtil.getReaderConfig("storageLocation"))
        OtherUtil.setReaderConfig("storageLocation", result);
      var filePath = ipcRenderer.sendSync("get-file-data");
      if (filePath === null || filePath === ".") {
        console.log("There is no file");
      } else {
        // Do something with the file.
        fetch(filePath)
          .then((response) => response.body)
          .then((body) => {
            const reader = body!.getReader();
            return new ReadableStream({
              start(controller) {
                return pump();
                function pump(): any {
                  return reader.read().then(({ done, value }) => {
                    // When no more data needs to be consumed, close the stream
                    if (done) {
                      controller.close();
                      return;
                    }
                    // Enqueue the next data chunk into our target stream
                    controller.enqueue(value);
                    return pump();
                  });
                }
              },
            });
          })
          .then((stream) => new Response(stream))
          .then((response) => response.blob())
          .then((blob) => {
            let fileTemp = new File([blob], filePath.split("\\").reverse()[0], {
              lastModified: new Date().getTime(),
              type: blob.type,
            });
            this.setState({ isOpenFile: true }, () => {
              this.doIncrementalTest(fileTemp);
            });
          })
          .catch((err) => console.error(err));
      }
    }
  }

  handleJump = (book: BookModel) => {
    RecentBooks.setRecent(book.key);
    book.description === "pdf"
      ? window.open(`./lib/pdf/viewer.html?file=${book.key}`)
      : window.open(`${window.location.href.split("#")[0]}#/epub/${book.key}`);
  };
  handleAddBook = (book: BookModel) => {
    return new Promise<void>((resolve, reject) => {
      let bookArr = [...this.props.books, ...this.props.deletedBooks];
      if (bookArr == null) {
        bookArr = [];
      }
      bookArr.push(book);
      this.props.handleReadingBook(book);
      RecordRecent.setRecent(book.key);
      localforage
        .setItem("books", bookArr)
        .then(() => {
          this.props.handleFetchBooks();
          this.props.handleMessage("Add Successfully");
          this.props.handleMessageBox(true);
          setTimeout(() => {
            this.state.isOpenFile && this.handleJump(book);
            this.setState({ isOpenFile: false });
            this.props.history.push("/manager/home");
          }, 1000);
          setTimeout(() => {
            this.props.handleLoadingDialog(false);
          }, 1000);
          resolve();
        })
        .catch(() => {
          setTimeout(() => {
            this.props.handleLoadingDialog(false);
          }, 1000);
          reject();
        });
    });
  };
  //获取书籍md5
  doIncrementalTest = (file: any) => {
    let extension = file.name.split(".")[file.name.split(".").length - 1];
    this.props.handleLoadingDialog(true);
    if (
      !isElectron() &&
      (extension === "txt" || extension === "mobi" || extension === "azw3")
    ) {
      this.props.handleLoadingDialog(false);
      console.log("Error occurs");
      return new Promise<void>((resolve, reject) => {
        reject();
      });
    }
    return new Promise<void>((resolve, reject) => {
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
          setTimeout(() => {
            this.props.handleLoadingDialog(false);
          }, 1000);
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
    let bookName = file.name.substr(0, file.name.length - extension.length - 1);
    return new Promise<void>((resolve, reject) => {
      //md5重复不导入
      let isRepeat = false;
      if ([...this.props.books, ...this.props.deletedBooks].length > 0) {
        [...this.props.books, ...this.props.deletedBooks].forEach((item) => {
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
            setTimeout(() => {
              this.props.handleLoadingDialog(false);
            }, 1000);
            reject();
            throw new Error();
          }
          if (extension === "pdf") {
            if (!e.target) {
              setTimeout(() => {
                this.props.handleLoadingDialog(false);
              }, 1000);
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
                        publisher: string,
                        description: string;
                      [name, author, description, publisher] = [
                        metadata.info.Title || bookName,
                        metadata.info.Author || "Unknown Authur",
                        "pdf",
                        metadata.info.publisher,
                      ];
                      let format = "PDF";
                      key = new Date().getTime() + "";
                      let book = new BookModel(
                        key,
                        name,
                        author,
                        description,
                        md5,
                        cover,
                        format,
                        publisher
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
                setTimeout(() => {
                  this.props.handleLoadingDialog(false);
                }, 1000);
                reject();
              });
          } else if (extension === "mobi" || extension === "azw3") {
            var reader = new FileReader();
            reader.onload = async (event) => {
              const file_content = (event.target as any).result;
              let mobiFile = new MobiFile(file_content);
              let content = await mobiFile.render(
                this.props.handleMessage,
                this.props.handleMessageBox
              );
              let buf = iconv.encode(content, "UTF-8");
              let blobTemp: any = new Blob([buf], { type: "text/plain" });
              let fileTemp = new File([blobTemp], file.name + ".txt", {
                lastModified: new Date().getTime(),
                type: blobTemp.type,
              });
              this.doIncrementalTest(fileTemp);
            };
            reader.readAsArrayBuffer(file);
          } else if (extension === "txt") {
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
                let fileTemp = new File([blobTemp], bookName + ".epub", {
                  lastModified: new Date().getTime(),
                  type: blobTemp.type,
                });

                this.doIncrementalTest(fileTemp);
              })
              .catch((err) => {
                this.props.handleMessage("Import Failed");
                this.props.handleMessageBox(true);
                console.log(err, "Error occurs");
                setTimeout(() => {
                  this.props.handleLoadingDialog(false);
                }, 1000);
                reject();
              });
          } else {
            let cover: any = "";
            const epub = window.ePub(e.target.result);
            epub.loaded.metadata
              .then((metadata: any) => {
                if (!e.target) {
                  setTimeout(() => {
                    this.props.handleLoadingDialog(false);
                  }, 1000);
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
                          description: string,
                          publisher: string;
                        [name, author, description, publisher] = [
                          metadata.title,
                          metadata.creator,
                          metadata.description,
                          metadata.publisher,
                        ];
                        let format =
                          publisher === "mobi"
                            ? "MOBI"
                            : publisher === "azw3"
                            ? "AZW3"
                            : publisher === "txt"
                            ? "TXT"
                            : "EPUB";
                        key = new Date().getTime() + "";
                        let book = new BookModel(
                          key,
                          name,
                          author,
                          description,
                          md5,
                          cover,
                          format,
                          publisher
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
                        publisher: string,
                        description: string;
                      [name, author, description, publisher] = [
                        metadata.title,
                        metadata.creator,
                        metadata.description,
                        metadata.publisher,
                      ];
                      let format =
                        publisher === "mobi"
                          ? "MOBI"
                          : publisher === "azw3"
                          ? "AZW3"
                          : publisher === "txt"
                          ? "TXT"
                          : "EPUB";
                      key = new Date().getTime() + "";
                      let book = new BookModel(
                        key,
                        name,
                        author,
                        description,
                        md5,
                        cover,
                        format,
                        publisher
                      );
                      await this.handleAddBook(book);
                      localforage.setItem(key, e.target!.result);
                      resolve();
                    }
                  })
                  .catch((err: any) => {
                    console.log(err, "err");
                    setTimeout(() => {
                      this.props.handleLoadingDialog(false);
                    }, 1000);
                    reject();
                  });
              })
              .catch(() => {
                this.props.handleMessage("Import Failed");
                this.props.handleMessageBox(true);
                console.log("Error occurs");
                setTimeout(() => {
                  this.props.handleLoadingDialog(false);
                }, 1000);
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
          this.props.handleDrag(false);
          for (let i = 0; i < acceptedFiles.length; i++) {
            let extension = acceptedFiles[i].name.split(".")[
              acceptedFiles[i].name.split(".").length - 1
            ];
            if (
              acceptedFiles.length > 1 &&
              (extension === "mobi" ||
                extension === "txt" ||
                extension === "azw3")
            ) {
              this.props.handleMessage(
                "Batch import only support epub or pdf files"
              );
              this.props.handleMessageBox(true);
              return;
            }

            //异步解析文件
            await this.doIncrementalTest(acceptedFiles[i]);
          }
          setTimeout(() => {
            this.props.handleLoadingDialog(false);
          }, 1000);
        }}
        accept={[".epub", ".pdf", ".txt", ".mobi", ".azw3"]}
        multiple={true}
      >
        {({ getRootProps, getInputProps }) => (
          <div className="import-from-local" {...getRootProps()}>
            <div className="animation-mask-local"></div>
            <span>
              <Trans>Import from Local</Trans>
            </span>

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
