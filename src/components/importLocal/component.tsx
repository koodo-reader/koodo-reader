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
import DOMPurify from "dompurify";
import {
  CommonTool,
  ConfigService,
} from "../../assets/lib/kookit-extra-browser.min";
import CoverUtil from "../../utils/file/coverUtil";
import { Readability } from "@mozilla/readability";
import {
  calculateFileMD5,
  fetchFileFromPath,
  supportedFormats,
  throttle,
  vexPromptAsync,
} from "../../utils/common";
import DatabaseService from "../../utils/storage/databaseService";
import { BookHelper } from "../../assets/lib/kookit.min";

// Convert supportedFormats to react-dropzone v14+ accept format
// Key is MIME type, value is array of file extensions
const supportedFormatsAccept = supportedFormats.reduce<
  Record<string, string[]>
>((obj, ext) => {
  const mimeType = CommonTool.getMimeType(ext.replace(".", ""));
  if (mimeType) {
    if (!obj[mimeType]) obj[mimeType] = [];
    obj[mimeType].push(ext);
  }
  return obj;
}, {});
declare var window: any;
let clickFilePath = "";

class ImportLocal extends React.Component<ImportLocalProps, ImportLocalState> {
  resizeHandler: (() => void) | null = null;

  constructor(props: ImportLocalProps) {
    super(props);
    this.state = {
      isOpenFile: false,
      width: document.body.clientWidth,
      isMoreOptionsVisible: false,
      importingShelfTitle: "",
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

      ipcRenderer.on("import-url-from-link", (_event: any, config: any) => {
        const rawUrl = config?.url;
        if (!rawUrl || typeof rawUrl !== "string") return;
        this.handleURLImport(undefined as any, rawUrl);
      });
    }
    this.resizeHandler = throttle(() => {
      this.setState({ width: document.body.clientWidth });
    });
    window.addEventListener("resize", this.resizeHandler);
    this.props.handleImportBookFunc(this.getMd5WithBrowser);
  }
  componentWillUnmount() {
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
      this.resizeHandler = null;
    }
  }
  handleFilePath = async (filePath: string) => {
    clickFilePath = filePath;
    let md5 = await calculateFileMD5(await fetchFileFromPath(filePath));

    let repeatBook: BookModel | null = await BookUtil.getBookByMd5(md5);
    if (repeatBook) {
      this.handleJump(repeatBook);
      return;
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
      toast.loading(
        this.props.t("Importing") + ": " + book.name.substring(0, 50),
        {
          id: "add-book",
        }
      );
      if (this.state.isOpenFile) {
        if (ConfigService.getReaderConfig("isPreventAdd") === "yes") {
          //ignore
        } else if (
          this.props.isAuthed &&
          ConfigService.getItem("defaultSyncOption")
        ) {
          await BookUtil.addBook(book.key, book.format.toLowerCase(), buffer);
          await CoverUtil.addCover(book);
        } else if (ConfigService.getReaderConfig("isImportPath") === "yes") {
          await CoverUtil.addCover(book);
          //ignore
        } else {
          await BookUtil.addBook(book.key, book.format.toLowerCase(), buffer);
          await CoverUtil.addCover(book);
        }
        if (ConfigService.getReaderConfig("isPreventAdd") === "yes") {
          this.handleJump(book);
          this.setState({ isOpenFile: false });
          toast.dismiss("add-book");
          return resolve();
        }
      } else {
        if (
          ConfigService.getReaderConfig("isImportPath") !== "yes" ||
          (this.props.isAuthed && ConfigService.getItem("defaultSyncOption"))
        ) {
          await BookUtil.addBook(book.key, book.format.toLowerCase(), buffer);
        }

        await CoverUtil.addCover(book);
      }

      this.props.handleReadingBook(book);
      ConfigService.setListConfig(book.key, "recentBooks");
      DatabaseService.saveRecord(book, "books")
        .then(() => {
          this.props.handleFetchBooks();
          if (this.props.mode === "shelf") {
            if (!this.state.importingShelfTitle) {
              this.setState({ importingShelfTitle: this.props.shelfTitle });
            }
            ConfigService.setMapConfig(
              this.state.importingShelfTitle || this.props.shelfTitle,
              book.key,
              "shelfList"
            );
          }
          toast.success(
            this.props.t("Addition successful") +
              ": " +
              book.name.substring(0, 50),
            {
              id: "add-book",
            }
          );
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
          console.error(error, book.name);
          toast.error(
            this.props.t("Import failed") + ": " + book.name.substring(0, 50),
            {
              duration: 4000,
              id: "add-book",
            }
          );
          return resolve();
        });
    });
  };

  getMd5WithBrowser = async (file: any) => {
    return new Promise<void>(async (resolve) => {
      const md5 = await calculateFileMD5(file);
      if (!md5) {
        console.error("md5 error", file.name);
        toast.error(this.props.t("Import failed") + ": " + file.name, {
          duration: 4000,
        });
        return resolve();
      } else {
        try {
          await this.handleBook(file, md5);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          toast.error(errorMessage);
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
      let repeatBook: BookModel | null = await BookUtil.getBookByMd5(md5);
      if (repeatBook) {
        isRepeat = true;
        if (this.props.books && this.props.books.length > 0) {
          this.props.books.forEach((item) => {
            if (item.key === repeatBook!.key) {
              toast.error(this.props.t("Duplicate book"));
              return resolve();
            }
          });
        }
        if (this.props.deletedBooks && this.props.deletedBooks.length > 0) {
          this.props.deletedBooks.forEach((item) => {
            if (item.key === repeatBook!.key) {
              toast.error(this.props.t("Duplicate book in trash bin"));
              return resolve();
            }
          });
        }
        return resolve();
      }
      if (!isRepeat) {
        let reader = new FileReader();
        reader.readAsArrayBuffer(file);

        reader.onload = async (e) => {
          if (!e.target) {
            console.error("e.target error", bookName);
            toast.error(this.props.t("Import failed") + ": " + bookName, {
              duration: 4000,
            });
            return resolve();
          }
          let reader = new FileReader();
          reader.onload = async (event) => {
            const file_content = (event.target as any).result;
            try {
              let rendition = BookHelper.getRendition(
                file_content,
                {
                  format: extension.toUpperCase(),
                  readerMode: "",
                  charset: "",
                  animation:
                    ConfigService.getReaderConfig("isSliding") === "yes"
                      ? "sliding"
                      : "",
                  convertChinese:
                    ConfigService.getReaderConfig("convertChinese"),
                  bookLayout: ConfigService.getReaderConfig("bookLayout"),
                  fullTranslationMode: "no",
                  textOrientation:
                    ConfigService.getReaderConfig("textOrientation"),
                  parserRegex: "",
                  isDarkMode: "no",
                  isMobile: "no",
                  password: "",
                  isScannedPDF: "no",
                },
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
                ConfigService.getReaderConfig("isPrecacheBook") === "yes" &&
                extension !== "pdf"
              ) {
                let cache = await rendition.preCache(file_content);
                if (cache !== "err" || cache) {
                  await BookUtil.addBook("cache-" + result.key, "zip", cache);
                }
              }
            } catch (error) {
              console.error(error, bookName);
              toast.error(this.props.t("Import failed") + ": " + bookName, {
                duration: 4000,
              });
              return resolve();
            }

            clickFilePath = "";

            // get metadata failed
            if (!result || !result.key) {
              console.error("get metadata failed", bookName);
              toast.error(this.props.t("Import failed") + ": " + bookName, {
                duration: 4000,
              });
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

  decodeHtmlEntities = (value: string) => {
    if (!value) return "";
    const doc = new DOMParser().parseFromString(value, "text/html");
    return doc.documentElement.textContent || value;
  };

  escapeHtml = (value: string) => {
    return (value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  makeUrlsAbsolute = (rootDoc: Document, baseUrl: string) => {
    const toAbs = (value: string | null) => {
      if (!value) return value;
      if (value.startsWith("data:")) return value;
      try {
        return new URL(value, baseUrl).toString();
      } catch {
        return value;
      }
    };

    rootDoc.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      const next = toAbs(href);
      if (next) a.setAttribute("href", next);
    });
    rootDoc.querySelectorAll("img[src]").forEach((img) => {
      const src = img.getAttribute("src");
      const next = toAbs(src);
      if (next) img.setAttribute("src", next);
    });
    rootDoc.querySelectorAll("link[href]").forEach((l) => {
      const href = l.getAttribute("href");
      const next = toAbs(href);
      if (next) l.setAttribute("href", next);
    });
  };

  importHtmlFromURL = async (
    url: string,
    urlFileName: string,
    toastId: string
  ) => {
    toast.loading(this.props.t("Downloading") + ": 0%", { id: toastId });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = (
      response.headers.get("content-type") || ""
    ).toLowerCase();
    const looksLikeHtml =
      contentType.includes("text/html") ||
      contentType.includes("application/xhtml+xml") ||
      contentType.includes("text/plain") ||
      contentType.includes("application/xml") ||
      contentType.includes("text/xml") ||
      !contentType;

    if (!looksLikeHtml) {
      throw new Error(
        this.props.t("Unsupported file format") +
          ": " +
          (contentType || "unknown")
      );
    }

    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    // 1) Try better main-content extraction (more aggressive clipping).
    let extracted: any = null;
    try {
      const reader = new Readability(doc as any);
      extracted = reader.parse();
    } catch (e) {
      extracted = null;
    }

    const rawTitle =
      extracted?.title ||
      doc.title ||
      (urlFileName || "book").replace(/\.[^/.]+$/, "") ||
      "book";
    const decodedTitle = this.decodeHtmlEntities(rawTitle).trim() || "book";

    // 2) Prefer extracted content; fallback to body html.
    const extractedContent = extracted?.content || doc.body?.innerHTML || "";

    // 3) Resolve relative links/images to absolute using the original URL.
    const contentDoc = parser.parseFromString(extractedContent, "text/html");
    if (contentDoc?.body) {
      this.makeUrlsAbsolute(contentDoc, url);
    }

    // 4) Sanitize & rebuild as a standalone html "book" file.
    const sanitizedBody = DOMPurify.sanitize(
      contentDoc.body?.innerHTML || extractedContent,
      {
        USE_PROFILES: { html: true },
      }
    );

    const safeTitle = this.escapeHtml(decodedTitle);
    const finalHtmlFileName = `${decodedTitle.replace(/[/\\?%*:|"<>]/g, "-")}.html`;
    const finalHtml = `<!doctype html><html><head><meta charset="utf-8"/><title>${safeTitle}</title></head><body>${sanitizedBody}</body></html>`;

    const blob = new Blob([new TextEncoder().encode(finalHtml)], {
      type: "text/html",
    });
    const file: any = new File([blob], finalHtmlFileName);
    file.path = url; // Helps bookkeeping; works in Electron, no harm in browser.

    toast.dismiss(toastId);
    await this.getMd5WithBrowser(file);
  };
  toggleMoreOptions = () => {
    this.setState((prevState) => ({
      isMoreOptionsVisible: !prevState.isMoreOptionsVisible,
    }));
  };

  // Add method to handle cloud import
  handleCloudImport = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the Dropzone
    this.setState({ isMoreOptionsVisible: false });

    this.props.handleImportDialog(true);
  };

  // Handle OPDS import
  handleOPDSImport = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the Dropzone
    this.setState({ isMoreOptionsVisible: false });
    this.props.handleOPDSDialog(true);
  };

  // Handle URL import
  handleURLImport = async (e?: React.MouseEvent, externalUrl?: string) => {
    e?.stopPropagation();
    this.setState({ isMoreOptionsVisible: false });
    const url =
      typeof externalUrl === "string"
        ? externalUrl
        : await vexPromptAsync(
            this.props.t("Enter book download URL or article URL"),
            "https://"
          );
    if (!url || typeof url !== "string") return;
    const trimmedUrl = url.trim();
    if (
      !trimmedUrl.startsWith("http://") &&
      !trimmedUrl.startsWith("https://")
    ) {
      toast.error(this.props.t("Please enter a valid http or https URL"));
      return;
    }
    let fileName = decodeURIComponent(
      trimmedUrl.split("?")[0].split("/").pop() || "book"
    );
    const ext = "." + fileName.split(".").pop()?.toLowerCase();
    const toastId = "url-download";
    if (
      !supportedFormats
        .filter((item) => item !== ".html" && item !== ".htm")
        .includes(ext)
    ) {
      try {
        await this.importHtmlFromURL(trimmedUrl, fileName, toastId);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error(this.props.t("Import failed") + ": " + errorMessage, {
          id: toastId,
        });
        console.error("URL import error:", error);
      }
      return;
    }

    toast.loading(this.props.t("Downloading") + ": 0%", { id: toastId });
    try {
      const response = await fetch(trimmedUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = response.body!.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total > 0) {
          const percent = Math.round((received / total) * 100);
          toast.loading(this.props.t("Downloading") + ": " + percent + "%", {
            id: toastId,
          });
        } else {
          toast.loading(
            this.props.t("Downloading") +
              ": " +
              (received / 1024).toFixed(1) +
              " KB",
            { id: toastId }
          );
        }
      }
      toast.dismiss(toastId);
      const arrayBuffer = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        arrayBuffer.set(chunk, offset);
        offset += chunk.length;
      }
      const blob = new Blob([arrayBuffer.buffer]);
      const file: any = new File([blob], fileName);
      await this.getMd5WithBrowser(file);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(this.props.t("Import failed") + ": " + errorMessage, {
        id: toastId,
      });
      console.error("URL import error:", error);
    }
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
          if (this.props.mode === "shelf") {
            this.setState({ importingShelfTitle: this.props.shelfTitle });
          }
          for (let item of acceptedFiles) {
            await this.getMd5WithBrowser(item);
          }
          this.setState({ importingShelfTitle: "" });
          if (
            ConfigService.getReaderConfig("isDisableAutoSync") !== "yes" &&
            ConfigService.getItem("defaultSyncOption")
          ) {
            await this.props.cloudSyncFunc();
          }
        }}
        accept={supportedFormatsAccept}
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
            {this.props.isCollapsed && this.state.width < 950 ? null : (
              <div
                className="more-import-option"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the Dropzone
                  this.toggleMoreOptions();
                }}
              >
                <span className="dropdown-triangle"></span>
                {this.state.isMoreOptionsVisible && (
                  <div
                    className="more-options-dropdown"
                    onMouseLeave={this.toggleMoreOptions}
                    style={
                      this.state.width < 950
                        ? {
                            bottom: "calc(100% + 5px)",
                            top: "unset",
                            right: "unset",
                            left: "-110px",
                          }
                        : {}
                    }
                  >
                    <div
                      className="more-option-item"
                      onClick={async (event) => {
                        event.stopPropagation(); // Prevent triggering the Dropzone
                        //select folder from local
                        if (isElectron) {
                          const { ipcRenderer } = window.require("electron");
                          const newPath =
                            await ipcRenderer.invoke("select-path");
                          if (!newPath) {
                            return;
                          }
                          //get all files in the folder
                          const fs = window.require("fs");
                          const path = window.require("path");
                          const getAllFiles = (dirPath: string): string[] => {
                            let files: string[] = [];

                            try {
                              const items = fs.readdirSync(dirPath);

                              for (const item of items) {
                                const fullPath = path.join(dirPath, item);
                                const stat = fs.statSync(fullPath);

                                if (stat.isDirectory()) {
                                  // Recursively get files from subdirectories
                                  files = files.concat(getAllFiles(fullPath));
                                } else if (stat.isFile()) {
                                  // Check if file has supported format
                                  const ext = path
                                    .extname(item)
                                    .toLowerCase()
                                    .substring(1);
                                  if (supportedFormats.includes(`.${ext}`)) {
                                    files.push(fullPath);
                                  }
                                }
                              }
                            } catch (error) {
                              const errorMessage =
                                error instanceof Error
                                  ? error.message
                                  : String(error);
                              toast.error(errorMessage);
                              console.error(
                                `Error reading directory ${dirPath}:`,
                                error
                              );
                            }

                            return files;
                          };

                          // Get all supported book files
                          const allFiles = getAllFiles(newPath);
                          // Process each file
                          if (this.props.mode === "shelf") {
                            this.setState({
                              importingShelfTitle: this.props.shelfTitle,
                            });
                          }
                          for (const filePath of allFiles) {
                            try {
                              const buffer =
                                await fs.promises.readFile(filePath);
                              const arraybuffer = new Uint8Array(buffer).buffer;
                              const blob = new Blob([arraybuffer]);
                              const fileName = path.basename(filePath);

                              let file: any = new File([blob], fileName);
                              file.path = filePath;

                              await this.getMd5WithBrowser(file);
                            } catch (error) {
                              const errorMessage =
                                error instanceof Error
                                  ? error.message
                                  : String(error);
                              toast.error(errorMessage);
                              console.error(
                                `Error processing file ${filePath}:`,
                                error
                              );
                            }
                          }
                          this.setState({
                            importingShelfTitle: "",
                            isMoreOptionsVisible: false,
                          });
                          if (
                            ConfigService.getReaderConfig(
                              "isDisableAutoSync"
                            ) !== "yes" &&
                            ConfigService.getItem("defaultSyncOption")
                          ) {
                            await this.props.cloudSyncFunc();
                          }
                        }
                      }}
                    >
                      <span className="more-option-text">
                        <Trans>Import folder</Trans>
                      </span>
                      {!isElectron && (
                        <input
                          type="file"
                          {...({
                            webkitdirectory: "",
                            mozdirectory: "",
                            directory: "",
                          } as React.InputHTMLAttributes<HTMLInputElement>)}
                          multiple
                          style={{
                            position: "absolute",
                            width: "100%",
                            height: "45px",
                            opacity: 0,
                            marginLeft: "-20px",
                            cursor: "pointer",
                          }}
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) {
                              return;
                            }
                            if (this.props.mode === "shelf") {
                              this.setState({
                                importingShelfTitle: this.props.shelfTitle,
                              });
                            }
                            for (let item of files) {
                              if (
                                !supportedFormats.find((format) =>
                                  item.name.toLowerCase().endsWith(format)
                                )
                              ) {
                                continue;
                              }
                              await this.getMd5WithBrowser(item);
                            }
                            this.setState({ importingShelfTitle: "" });
                            this.toggleMoreOptions();
                            if (
                              ConfigService.getReaderConfig(
                                "isDisableAutoSync"
                              ) !== "yes" &&
                              ConfigService.getItem("defaultSyncOption")
                            ) {
                              await this.props.cloudSyncFunc();
                            }
                          }}
                        ></input>
                      )}
                    </div>
                    <div
                      className="more-option-item"
                      onClick={this.handleCloudImport}
                    >
                      <span className="more-option-text">
                        <Trans>From cloud storage</Trans>
                      </span>
                    </div>
                    <div
                      className="more-option-item"
                      onClick={this.handleOPDSImport}
                    >
                      <span className="more-option-text">
                        <Trans>From OPDS</Trans>
                      </span>
                    </div>
                    <div
                      className="more-option-item"
                      onClick={this.handleURLImport}
                    >
                      <span className="more-option-text">
                        <Trans>From URL</Trans>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
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
                  if (this.props.mode === "shelf") {
                    this.setState({
                      importingShelfTitle: this.props.shelfTitle,
                    });
                  }
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
                      const errorMessage =
                        error instanceof Error ? error.message : String(error);
                      toast.error(errorMessage);
                      console.error(
                        `Error processing file ${filePath}:`,
                        error
                      );
                    }
                  }
                  this.setState({ importingShelfTitle: "" });
                  if (
                    ConfigService.getReaderConfig("isDisableAutoSync") !==
                      "yes" &&
                    ConfigService.getItem("defaultSyncOption")
                  ) {
                    await this.props.cloudSyncFunc();
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
