//从本地导入书籍
import React from "react";
import "./importLocal.css";
import BookModel from "../../model/Book";
import localforage from "localforage";
import { fetchMD5 } from "../../utils/md5Util";
import { addEpub } from "../../utils/epubUtil";
import { Trans } from "react-i18next";
import Dropzone from "react-dropzone";
import { Tooltip } from "react-tippy";
import { ImportLocalProps, ImportLocalState } from "./interface";
import RecordRecent from "../../utils/readUtils/recordRecent";
import MobiParser from "../../utils/mobiParser";
import iconv from "iconv-lite";
import { isElectron } from "react-device-detect";
import { withRouter } from "react-router-dom";
import RecentBooks from "../../utils/readUtils/recordRecent";
import BookUtil from "../../utils/bookUtil";
import { generateEpub } from "../../utils/generateEpub";
import { addPdf } from "../../utils/pdfUtil";
import { fetchFileFromPath, fetchMD5FromPath } from "../../utils/fileUtil";

declare var window: any;

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
    let md5 = await fetchMD5FromPath(filePath);
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
        this.handleJump(repeatBook);
        return;
      }
    }
    const fileTemp = await fetchFileFromPath(filePath);
    this.setState({ isOpenFile: true }, async () => {
      await this.getMd5WithBrowser(fileTemp);
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
          reject();
        });
    });
  };

  //获取书籍md5
  getMd5WithBrowser = async (file: any) => {
    return new Promise<void>(async (resolve, reject) => {
      const md5 = await fetchMD5(file);
      if (!md5) {
        reject();
      } else {
        await this.handleBook(file, md5);
        resolve();
      }
    });
  };

  handleBook = (file: any, md5: string) => {
    let extension = file.name.split(".").reverse()[0];
    let bookName = file.name.substr(0, file.name.length - extension.length - 1);
    let result: BookModel | Boolean;
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

            reject();
            throw new Error();
          }

          if (extension === "pdf") {
            result = await addPdf(
              e.target.result as ArrayBuffer,
              md5,
              bookName
            );
            if (!result) {
              this.props.handleMessage("Import Failed");
              this.props.handleMessageBox(true);

              reject();
              throw new Error();
            } else {
              await this.handleAddBook(result as BookModel);
              BookUtil.addBook(
                (result as BookModel).key,
                e.target!.result as ArrayBuffer
              );
              resolve();
            }
          } else if (extension === "mobi" || extension === "azw3") {
            let reader = new FileReader();
            reader.onload = async (event) => {
              const file_content = (event.target as any).result;
              let mobiFile = new MobiParser(file_content);
              let content: any = await mobiFile.render(isElectron);
              if (typeof content === "object") {
                result = BookUtil.generateBook(bookName, extension, md5);
                await this.handleAddBook(result);
                BookUtil.addBook(result.key, file_content as ArrayBuffer);
                resolve();
              } else {
                let buf = iconv.encode(content, "UTF-8");
                let blobTemp: any = new Blob([buf], { type: "text/plain" });
                let fileTemp = new File([blobTemp], file.name + ".txt", {
                  lastModified: new Date().getTime(),
                  type: blobTemp.type,
                });
                await this.getMd5WithBrowser(fileTemp);
                resolve();
              }
            };
            reader.readAsArrayBuffer(file);
          } else if (extension === "txt") {
            if (isElectron) {
              let _result = await generateEpub(file);
              if (_result) {
                await this.getMd5WithBrowser(_result);
                resolve();
              } else {
                this.props.handleMessage("Import Failed");
                this.props.handleMessageBox(true);

                reject();
              }
            } else {
              let reader = new FileReader();
              reader.readAsArrayBuffer(file);
              reader.onload = async (event) => {
                result = BookUtil.generateBook(bookName, extension, md5);
                await this.handleAddBook(result);
                BookUtil.addBook(result.key, (event.target as any).result);
                resolve();
              };
            }
          } else if (
            extension === "djvu" ||
            extension === "docx" ||
            extension === "md" ||
            extension === "cbz" ||
            extension === "cbr" ||
            extension === "cbt" ||
            extension === "rtf" ||
            extension === "fb2"
          ) {
            let reader = new FileReader();
            reader.onload = async (event) => {
              const file_content = (event.target as any).result;
              result = BookUtil.generateBook(bookName, extension, md5);
              await this.handleAddBook(result);
              BookUtil.addBook(result.key, file_content as ArrayBuffer);
              resolve();
            };
            reader.readAsArrayBuffer(file);
          } else {
            result = await addEpub(file, md5);
            if (!result) {
              this.props.handleMessage("Import Failed");
              this.props.handleMessageBox(true);

              reject();
              throw new Error();
            } else {
              await this.handleAddBook(result as BookModel);
              BookUtil.addBook(
                (result as BookModel).key,
                e.target!.result as ArrayBuffer
              );
              resolve();
            }
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
          for (let item of acceptedFiles) {
            await this.getMd5WithBrowser(item);
          }
        }}
        accept={[
          ".epub",
          ".pdf",
          ".txt",
          ".mobi",
          ".azw3",
          ".djvu",
          ".docx",
          ".rtf",
          ".md",
          ".fb2",
          ".cbz",
          ".cbt",
          ".cbr",
        ]}
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
