import React from "react";
import "./importLocal.css";
import BookModel from "../../models/Book";

import { Trans } from "react-i18next";
import Dropzone from "react-dropzone";
import * as Kookit from "../../assets/lib/kookit.min";
import { ImportLocalProps, ImportLocalState } from "./interface";
import { isElectron } from "react-device-detect";
import { withRouter } from "react-router-dom";
import BookUtil from "../../utils/file/bookUtil";
import toast from "react-hot-toast";
import {
  CommonTool,
  ConfigService,
} from "../../assets/lib/kookit-extra-browser.min";
import CoverUtil from "../../utils/file/coverUtil";
import { calculateFileMD5, fetchFileFromPath } from "../../utils/common";
import DatabaseService from "../../utils/storage/databaseService";
import { BookHelper } from "../../assets/lib/kookit-extra-browser.min";
import SyncService from "../../utils/storage/syncService";
declare var window: any;
let clickFilePath = "";

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
      if (!ConfigService.getItem("storageLocation")) {
        ConfigService.setItem(
          "storageLocation",
          ipcRenderer.sendSync("storage-location", "ping")
        );
      }

      const filePath = ipcRenderer.sendSync("get-file-data");
      if (filePath && filePath !== ".") {
        this.handleFilePath(filePath);
      }
      window.addEventListener(
        "focus",
        () => {
          const _filePath = ipcRenderer.sendSync("get-file-data");
          if (_filePath && _filePath !== ".") {
            this.handleFilePath(_filePath);
          }
        },
        false
      );
    }
    window.addEventListener("resize", () => {
      this.setState({ width: document.body.clientWidth });
    });
  }
  handleFilePath = async (filePath: string) => {
    clickFilePath = filePath;
    let md5 = await calculateFileMD5(await fetchFileFromPath(filePath));
    if ([...(this.props.books || []), ...this.props.deletedBooks].length > 0) {
      let isRepeat = false;
      let repeatBook: BookModel | null = null;
      [...(this.props.books || []), ...this.props.deletedBooks].forEach(
        (item) => {
          if (item.md5 === md5) {
            isRepeat = true;
            repeatBook = item;
          }
        }
      );
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
    ConfigService.setItem("tempBook", JSON.stringify(book));
    BookUtil.redirectBook(book);
    this.props.history.push("/manager/home");
  };
  handleAddBook = (book: BookModel, buffer: ArrayBuffer) => {
    return new Promise<void>(async (resolve) => {
      if (this.state.isOpenFile) {
        if (
          ConfigService.getReaderConfig("isImportPath") !== "yes" &&
          ConfigService.getReaderConfig("isPreventAdd") !== "yes"
        ) {
          BookUtil.addBook(book.key, book.format.toLowerCase(), buffer);
          CoverUtil.addCover(book);
        }
        if (ConfigService.getReaderConfig("isPreventAdd") === "yes") {
          this.handleJump(book);
          this.setState({ isOpenFile: false });
          return resolve();
        }
      } else {
        ConfigService.getReaderConfig("isImportPath") !== "yes" &&
          BookUtil.addBook(book.key, book.format.toLowerCase(), buffer);

        CoverUtil.addCover(book);
      }
      if (
        this.props.isAuthed &&
        ConfigService.getReaderConfig("isImportPath") === "yes"
      ) {
        this.uploadBookToCloud(book);
      }

      this.props.handleReadingBook(book);
      ConfigService.setListConfig(book.key, "recentBooks");
      DatabaseService.saveRecord(book, "books")
        .then(() => {
          this.props.handleFetchBooks();
          if (this.props.mode === "shelf") {
            ConfigService.setMapConfig(
              this.props.shelfTitle,
              book.key,
              "shelfList"
            );
          }
          toast.success(this.props.t("Addition successful"));
          setTimeout(() => {
            this.state.isOpenFile && this.handleJump(book);
            if (
              ConfigService.getReaderConfig("isOpenInMain") === "yes" &&
              this.state.isOpenFile
            ) {
              this.setState({ isOpenFile: false });
              return;
            }
            this.setState({ isOpenFile: false });
            this.props.history.push("/manager/home");
          }, 100);
          return resolve();
        })
        .catch((error) => {
          console.error(error);
          toast.error(this.props.t("Import failed"));
          return resolve();
        });
    });
  };
  uploadBookToCloud = async (book: BookModel) => {
    let syncUtil = await SyncService.getSyncUtil();
    let bookBuffer: any = await BookUtil.fetchBook(
      book.key,
      book.format,
      true,
      book.path
    );
    let bookBlob = new Blob([bookBuffer], {
      type: CommonTool.getMimeType(book.format.toLowerCase()),
    });
    await syncUtil.uploadFile(
      book.key + "." + book.format.toLowerCase(),
      "book",
      bookBlob
    );
  };

  getMd5WithBrowser = async (file: any) => {
    return new Promise<void>(async (resolve) => {
      const md5 = await calculateFileMD5(file);
      if (!md5) {
        console.error("md5 error");
        toast.error(this.props.t("Import failed"));
        return resolve();
      } else {
        try {
          await this.handleBook(file, md5);
        } catch (error) {
          console.error(error);
        }

        return resolve();
      }
    });
  };

  handleBook = (file: any, md5: string) => {
    let extension = (file.name as string)
      .split(".")
      .reverse()[0]
      .toLocaleLowerCase();
    let bookName = file.name.substr(0, file.name.length - extension.length - 1);
    let result: BookModel;
    return new Promise<void>(async (resolve) => {
      let isRepeat = false;

      if (this.props.books && this.props.books.length > 0) {
        this.props.books.forEach((item) => {
          if (item.md5 === md5 && item.size === file.size) {
            isRepeat = true;
            toast.error(this.props.t("Duplicate book"));
            return resolve();
          }
        });
      }
      if (this.props.deletedBooks && this.props.deletedBooks.length > 0) {
        this.props.deletedBooks.forEach((item) => {
          if (item.md5 === md5 && item.size === file.size) {
            isRepeat = true;
            toast.error(this.props.t("Duplicate book in trash bin"));
            return resolve();
          }
        });
      }
      if (!this.props.books) {
        let books = await DatabaseService.getAllRecords("books");
        books.forEach((item) => {
          if (item.md5 === md5 && item.size === file.size) {
            isRepeat = true;
            toast.error(this.props.t("Duplicate book"));
            return resolve();
          }
        });
      }
      if (!isRepeat) {
        let reader = new FileReader();
        reader.readAsArrayBuffer(file);

        reader.onload = async (e) => {
          if (!e.target) {
            console.error("e.target error");
            toast.error(this.props.t("Import failed"));
            return resolve();
          }
          let reader = new FileReader();
          reader.onload = async (event) => {
            const file_content = (event.target as any).result;
            try {
              let rendition = BookHelper.getRendtion(
                file_content,
                extension.toUpperCase(),
                "",
                "",
                ConfigService.getReaderConfig("isSliding") === "yes"
                  ? "sliding"
                  : "",
                ConfigService.getReaderConfig("convertChinese"),
                "",
                Kookit
              );
              result = await BookHelper.generateBook(
                bookName,
                extension,
                md5,
                file.size,
                file.path || clickFilePath,
                file_content,
                rendition
              );
              if (
                (ConfigService.getReaderConfig("isPrecacheBook") === "yes" ||
                  (this.props.isAuthed &&
                    ConfigService.getReaderConfig("isDisableMobilePrecache") !==
                      "yes")) &&
                extension !== "pdf"
              ) {
                let cache = await rendition.preCache(file_content);
                if (cache !== "err" || cache) {
                  BookUtil.addBook("cache-" + result.key, "zip", cache);
                }
              }
            } catch (error) {
              console.error(error);
              return resolve();
            }

            clickFilePath = "";

            // get metadata failed
            if (!result || !result.key) {
              console.error("get metadata failed");
              toast.error(this.props.t("Import failed"));
              return resolve();
            }
            await this.handleAddBook(
              result as BookModel,
              file_content as ArrayBuffer
            );

            return resolve();
          };
          reader.readAsArrayBuffer(file);
        };
      }
    });
  };

  render() {
    return (
      <Dropzone
        onDrop={async (acceptedFiles) => {
          this.props.handleDrag(false);
          if (ConfigService.getReaderConfig("isImportPath") === "yes") {
            toast.error(
              this.props.t("Please turn off import books as link first")
            );
            return;
          }
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
          ".azw",
          ".htm",
          ".html",
          ".xml",
          ".xhtml",
          ".mhtml",
          ".docx",
          ".md",
          ".fb2",
          ".cbz",
          ".cbt",
          ".cbr",
          ".cb7",
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
              <span
                className="icon-folder"
                style={{ fontSize: "15px", fontWeight: 500 }}
              ></span>
            ) : (
              <span>
                <Trans>Import</Trans>
              </span>
            )}

            {!isElectron ? (
              <input
                type="file"
                id="import-book-box"
                className="import-book-box"
                name="file"
                {...getInputProps()}
              />
            ) : (
              <div
                className="import-book-box"
                onClick={async () => {
                  const { ipcRenderer } = window.require("electron");
                  let filePaths = await ipcRenderer.invoke(
                    "select-book",
                    "ping"
                  );
                  for (let filePath of filePaths) {
                    try {
                      const fs = window.require("fs").promises;
                      const path = window.require("path");
                      const buffer = await fs.readFile(filePath);

                      let arraybuffer = new Uint8Array(buffer).buffer;
                      let blob = new Blob([arraybuffer]);
                      let fileName = path.basename(filePath);
                      let file: any = new File([blob], fileName);
                      file.path = filePath;

                      await this.getMd5WithBrowser(file);
                    } catch (error) {
                      console.error(
                        `Error processing file ${filePath}:`,
                        error
                      );
                    }
                  }
                }}
              ></div>
            )}
          </div>
        )}
      </Dropzone>
    );
  }
}

export default withRouter(ImportLocal as any);
