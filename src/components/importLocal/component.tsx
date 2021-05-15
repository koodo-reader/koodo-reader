//从本地导入书籍
import React from "react";
import "./importLocal.css";
import BookModel from "../../model/Book";
import localforage from "localforage";
import SparkMD5 from "spark-md5";
import { Trans } from "react-i18next";
import Dropzone from "react-dropzone";
import { Tooltip } from "react-tippy";
import { ImportLocalProps, ImportLocalState } from "./interface";
import RecordRecent from "../../utils/readUtils/recordRecent";
import MobiFile from "../../utils/mobiUtil";
import iconv from "iconv-lite";
import { isElectron } from "react-device-detect";
import { withRouter } from "react-router-dom";
import RecentBooks from "../../utils/readUtils/recordRecent";
import BookUtil from "../../utils/bookUtil";

declare var window: any;
var pdfjsLib = window["pdfjs-dist/build/pdf"];

class ImportLocal extends React.Component<ImportLocalProps, ImportLocalState> {
  constructor(props: ImportLocalProps) {
    super(props);
    this.state = {
      isOpenFile: false,
      width: document.body.clientWidth,
    };
  }
  componentDidMount() {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      if (!localStorage.getItem("storageLocation")) {
        localStorage.setItem(
          "storageLocation",
          ipcRenderer.sendSync("storage-location", "ping")
        );
      }
      var filePath = ipcRenderer.sendSync("get-file-data");
      if (filePath && filePath !== ".") {
        this.handleFilePath(filePath);
      }
    }
    window.addEventListener("resize", () => {
      this.setState({ width: document.body.clientWidth });
    });
  }
  handleFilePath = async (filePath: string) => {
    var crypto = window.require("crypto");
    var fs = window.require("fs");

    var md5sum = crypto.createHash("md5");
    var s = fs.ReadStream(filePath);
    s.on("data", function (d) {
      md5sum.update(d);
    });

    s.on("end", () => {
      var md5 = md5sum.digest("hex");
      if ([...this.props.books, ...this.props.deletedBooks].length > 0) {
        let isRepeat = false;
        let repeatBook: BookModel | null = null;
        [...this.props.books, ...this.props.deletedBooks].forEach((item) => {
          if (item.md5 === md5) {
            isRepeat = true;
            repeatBook = item;
          }
        });
        if (isRepeat && repeatBook) {
          this.props.handleLoadingDialog(false);
          this.handleJump(repeatBook);
          return;
        }
      }
      fetch(filePath)
        .then((response) => response.body)
        .then((body) => {
          const reader = body!.getReader();
          return new ReadableStream({
            start(controller) {
              return pump();
              function pump(): any {
                return reader.read().then(({ done, value }) => {
                  if (done) {
                    controller.close();
                    return;
                  }
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
          let fileTemp = new File(
            [blob],
            window.navigator.platform.indexOf("Win") > -1
              ? filePath.split("\\").reverse()[0]
              : filePath.split("/").reverse()[0],
            {
              lastModified: new Date().getTime(),
              type: blob.type,
            }
          );
          this.setState({ isOpenFile: true }, async () => {
            await this.getMd5WithBrowser(fileTemp);
          });
        })
        .catch((err) => console.error(err));
    });
  };
  handleJump = (book: BookModel) => {
    RecentBooks.setRecent(book.key);
    BookUtil.RedirectBook(book);
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
          }, 100);
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
  getMd5WithBrowser = (file: any) => {
    let extension = file.name.split(".").reverse()[0];
    this.props.handleLoadingDialog(true);
    if (
      !isElectron &&
      (extension === "txt" || extension === "mobi" || extension === "azw3")
    ) {
      this.props.handleLoadingDialog(false);
      console.log("Error occurs");
      this.props.handleDownloadDesk(true);
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
    let extension = file.name.split(".").reverse()[0];
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
                pdfDoc.getMetadata().then(async (metadata: any) => {
                  let cover: any = "noCover";
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
                  BookUtil.addBook(key, e.target!.result as ArrayBuffer);
                  resolve();
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
              let content: any = await mobiFile.render(
                this.props.handleMessage,
                this.props.handleMessageBox
              );
              let buf = iconv.encode(content, "UTF-8");
              let blobTemp: any = new Blob([buf], { type: "text/plain" });
              let fileTemp = new File([blobTemp], file.name + ".txt", {
                lastModified: new Date().getTime(),
                type: blobTemp.type,
              });
              await this.getMd5WithBrowser(fileTemp);
              resolve();
            };
            reader.readAsArrayBuffer(file);
          } else if (extension === "txt") {
            let result = await BookUtil.parseBook(file);
            if (result) {
              await this.getMd5WithBrowser(result);
              resolve();
            } else {
              this.props.handleMessage("Import Failed");
              this.props.handleMessageBox(true);
              setTimeout(() => {
                this.props.handleLoadingDialog(false);
              }, 1000);
              reject();
            }
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
                        BookUtil.addBook(key, e.target!.result as ArrayBuffer);
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
                      BookUtil.addBook(key, e.target!.result as ArrayBuffer);
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
            //异步解析文件
            await this.getMd5WithBrowser(acceptedFiles[i]);
          }
          setTimeout(() => {
            this.props.handleLoadingDialog(false);
          }, 1000);
        }}
        accept={[".epub", ".pdf", ".txt", ".mobi", ".azw3"]}
        multiple={true}
      >
        {({ getRootProps, getInputProps }) => (
          <div
            className="import-from-local"
            {...getRootProps()}
            style={
              this.props.isCollapsed && document.body.clientWidth < 950
                ? { width: "42px" }
                : {}
            }
          >
            <div className="animation-mask-local"></div>
            {this.props.isCollapsed && this.state.width < 950 ? (
              <Tooltip
                title={this.props.t("Import from Local")}
                position="top"
                style={{ height: "20px" }}
                trigger="mouseenter"
              >
                <span
                  className="icon-folder"
                  style={{ fontSize: "15px", fontWeight: 500 }}
                ></span>
              </Tooltip>
            ) : (
              <span>
                <Trans>Import from Local</Trans>
              </span>
            )}

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
