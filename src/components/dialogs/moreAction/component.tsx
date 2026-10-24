import React, { useState } from "react";
import "./moreAction.css";
import { Trans } from "react-i18next";
import { MoreActionProps, MoreActionState } from "./interface";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import BookUtil from "../../../utils/file/bookUtil";
import CoverUtil from "../../../utils/file/coverUtil";
import {
  exportBookPackage,
  exportDictionaryHistory,
  exportHighlights,
  exportNotes,
  getBookName,
} from "../../../utils/file/export";
import { isElectron } from "react-device-detect";
import DatabaseService from "../../../utils/storage/databaseService";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import * as Kookit from "../../../assets/lib/kookit.min";
import {
  getPdfPassword,
  getStorageLocation,
  getTextRules,
  isFixedLayoutBook,
} from "../../../utils/common";
import { BookHelper } from "../../../assets/lib/kookit.min";
import {
  clampMenuPosition,
  CONTEXT_MENU_WIDTH,
  estimateMenuHeight,
  SUBMENU_GAP,
} from "../../../utils/common";
declare var window: any;

const MoreAction = (props: MoreActionProps) => {
  const [state, setState] = useState<MoreActionState>({ exportSubmenu: "" });

  const renderFormatSubmenu = (type: "notes" | "highlights" | "words") => {
    const isVisible = state.exportSubmenu === type;
    const isNotes = type === "notes";
    const isWords = type === "words";
    const filterFn = isWords
      ? () => true
      : isNotes
        ? (note: any) =>
            note.notes && note.notes.length > 0 && note.notes !== "annotation"
        : (note: any) => note.notes === "";
    const exportFn = (
      isWords
        ? exportDictionaryHistory
        : isNotes
          ? exportNotes
          : exportHighlights
    ) as (
      records: any[],
      books: any[],
      format: "csv" | "md" | "txt" | "html" | "pdf" | "json"
    ) => Promise<"success" | "failed" | "cancel">;
    const formats = isWords
      ? (["csv", "json"] as const)
      : (["csv", "md", "txt", "html", "pdf", "json"] as const);
    const formatLabels: Record<string, string> = {
      csv: "CSV",
      md: "Markdown",
      txt: "TXT",
      html: "HTML",
      pdf: "PDF",
      json: "JSON",
    };

    const handleExport = async (
      format: "csv" | "md" | "txt" | "html" | "pdf" | "json"
    ) => {
      let books = await DatabaseService.getAllRecords("books");
      let records = (
        await DatabaseService.getRecordsByBookKey(
          props.currentBook.key,
          isWords ? "words" : "notes"
        )
      ).filter(filterFn);
      if (records.length > 0) {
        const result = await exportFn(records, books, format);
        if (result === "success") {
          toast.success(props.t("Export successful"), { id: "exporting" });
        } else if (result === "failed") {
          toast.error(props.t("Failed to export"), { id: "exporting" });
        }
      } else {
        toast(props.t("Nothing to export"));
      }
      setState((prev) => ({ ...prev, exportSubmenu: "" }));
      props.handleMoreAction(false);
      props.handleActionDialog(false);
    };

    const noteOffset = isWords ? 4 : isNotes ? 2 : 3;
    const itemHeight = 33;
    // 主菜单渲染时会被 clampMenuPosition 校正到视口内（靠近底部时会整体上移），
    // 格式子菜单必须以主菜单“实际渲染后的 top”为基准水平对齐，而不是用未校正的 top，
    // 否则主菜单上移后子菜单仍贴在底部边缘，无法点击。
    const mainMenuPos = clampMenuPosition(
      props.left + (props.isExceed ? -SUBMENU_GAP : SUBMENU_GAP),
      props.top + 103,
      CONTEXT_MENU_WIDTH,
      estimateMenuHeight(isElectron ? 11 : 10)
    );

    return (
      <div
        className="action-dialog-container export-format-submenu-action"
        style={
          isVisible
            ? (() => {
                const pos = clampMenuPosition(
                  props.left +
                    (props.isExceed ? -SUBMENU_GAP : SUBMENU_GAP) +
                    195,
                  mainMenuPos.top + noteOffset * itemHeight,
                  120,
                  estimateMenuHeight(isWords ? 2 : 6)
                );
                return {
                  position: "fixed",
                  left: pos.left,
                  top: pos.top,
                  zIndex: 10,
                };
              })()
            : { display: "none" }
        }
        onMouseEnter={() => {
          setState((prev) => ({ ...prev, exportSubmenu: type }));
        }}
        onMouseLeave={() => {
          setState((prev) => ({ ...prev, exportSubmenu: "" }));
          props.handleMoreAction(false);
          props.handleActionDialog(false);
        }}
      >
        <div className="action-dialog-actions-container">
          {formats.map((fmt) => (
            <div
              key={fmt}
              className="action-dialog-edit"
              style={{ paddingLeft: "0px" }}
              onClick={() => handleExport(fmt)}
            >
              <p className="action-name">{formatLabels[fmt]}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className="action-dialog-container"
        onMouseLeave={() => {
          if (!state.exportSubmenu) {
            props.handleMoreAction(false);
            props.handleActionDialog(false);
          }
        }}
        onMouseEnter={(event) => {
          props.handleMoreAction(true);
          props.handleActionDialog(true);
          event?.stopPropagation();
        }}
        style={
          props.isShowExport
            ? (() => {
                const pos = clampMenuPosition(
                  props.left + (props.isExceed ? -SUBMENU_GAP : SUBMENU_GAP),
                  props.top + 103,
                  CONTEXT_MENU_WIDTH,
                  estimateMenuHeight(isElectron ? 11 : 10)
                );
                return { position: "fixed", left: pos.left, top: pos.top };
              })()
            : { display: "none" }
        }
      >
        <div className="action-dialog-actions-container">
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={async () => {
              props.handleMoreAction(false);
              props.handleActionDialog(false);
              const result = await exportBookPackage([props.currentBook]);
              if (result === "success") {
                toast.success(props.t("Export successful"), {
                  id: "exporting",
                });
              } else if (result === "failed") {
                toast.dismiss("exporting");
                toast.error(props.t("Failed to export"), {
                  id: "exporting",
                });
              }
            }}
          >
            <p className="action-name">
              <Trans>Export book package</Trans>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={() => {
              BookUtil.fetchBook(
                props.currentBook.key,
                props.currentBook.format.toLowerCase(),
                true,
                props.currentBook.path
              ).then((result: any) => {
                toast.success(props.t("Export successful"), {
                  id: "exporting",
                });
                saveAs(new Blob([result]), getBookName(props.currentBook));
              });
            }}
          >
            <p className="action-name">
              <Trans>Export books</Trans>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={async () => {
              const isCoverExist = await CoverUtil.isCoverExist(
                props.currentBook
              );
              if (!isCoverExist) {
                toast(props.t("Nothing to export"));
                return;
              }
              const cover = await CoverUtil.getCover(props.currentBook);
              if (cover.startsWith("blob:") || cover.startsWith("asset:")) {
                const response = await fetch(cover);
                const blob = await response.blob();
                const ext = blob.type.split("/")[1] || "jpg";
                saveAs(blob, `${props.currentBook.name}.${ext}`);
              } else if (cover.startsWith("data:")) {
                const mimeMatch = cover.match(/data:(image\/\w+);base64,/);
                const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
                const ext = mime.split("/")[1] || "jpg";
                const base64Data = cover.split("base64,")[1];
                const byteArray = Uint8Array.from(atob(base64Data), (c) =>
                  c.charCodeAt(0)
                );
                saveAs(
                  new Blob([byteArray], { type: mime }),
                  `${props.currentBook.name}.${ext}`
                );
              } else if (isElectron) {
                const fs = window.electronAPI.fs;
                const ext = cover.split(".").pop() || "jpg";
                const buffer = fs.readFileSync(cover);
                saveAs(
                  new Blob([buffer], { type: `image/${ext}` }),
                  `${props.currentBook.name}.${ext}`
                );
              }
              toast.success(props.t("Export successful"), {
                id: "exporting",
              });
            }}
          >
            <p className="action-name">
              <Trans>Export cover</Trans>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onMouseEnter={() => {
              setState((prev) => ({ ...prev, exportSubmenu: "notes" }));
            }}
            onMouseLeave={() => {
              setState((prev) => ({ ...prev, exportSubmenu: "" }));
            }}
          >
            <p className="action-name export-action-name">
              <Trans>Export notes</Trans>
              <span className="icon-dropdown icon-export-all"></span>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onMouseEnter={() => {
              setState((prev) => ({ ...prev, exportSubmenu: "highlights" }));
            }}
            onMouseLeave={() => {
              setState((prev) => ({ ...prev, exportSubmenu: "" }));
            }}
          >
            <p className="action-name export-action-name">
              <Trans>Export highlights</Trans>
              <span className="icon-dropdown icon-export-all"></span>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onMouseEnter={() => {
              setState((prev) => ({ ...prev, exportSubmenu: "words" }));
            }}
            onMouseLeave={() => {
              setState((prev) => ({ ...prev, exportSubmenu: "" }));
            }}
          >
            <p className="action-name export-action-name">
              <Trans>Export dictionary history</Trans>
              <span className="icon-dropdown icon-export-all"></span>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={() => {
              if (
                props.currentBook.format === "PDF" ||
                isFixedLayoutBook(props.currentBook)
              ) {
                toast(props.t("Not supported yet"));
                return;
              }
              toast(props.t("Pre-caching"));
              BookUtil.fetchBook(
                props.currentBook.key,
                props.currentBook.format.toLowerCase(),
                true,
                props.currentBook.path
              ).then(async (result: any) => {
                let rendition = BookHelper.getRendition(
                  result,
                  {
                    format: props.currentBook.format,
                    readerMode: "",
                    charset: props.currentBook.charset,
                    animation:
                      ConfigService.getReaderConfig("animation") || "none",
                    convertChinese:
                      ConfigService.getReaderConfig("convertChinese"),
                    bookLayout: ConfigService.getReaderConfig("bookLayout"),
                    textRules: getTextRules(props.currentBook.key),
                    codeHighlight:
                      ConfigService.getReaderConfig("codeHighlight") || "",
                    fullTranslationMode: "no",
                    textOrientation:
                      ConfigService.getReaderConfig("textOrientation"),
                    parserRegex: "",
                    isDarkMode: "no",
                    isMobile: "no",
                    password: getPdfPassword(props.currentBook),
                    isScannedPDF: "no",
                    isKeepPDFBackground: "no",
                  },
                  Kookit
                );
                let cache = await rendition.preCache(result);
                if (cache !== "err" || cache) {
                  await BookUtil.addBook(
                    "cache-" + props.currentBook.key,
                    "zip",
                    cache
                  );
                  toast.success(props.t("Pre-caching successful"), {
                    id: "add-book",
                  });
                } else {
                  toast.error(props.t("Pre-caching failed"), {
                    id: "add-book",
                  });
                }
              });
            }}
          >
            <p className="action-name">
              <Trans>Pre-cache</Trans>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={async () => {
              await BookUtil.deleteBook("cache-" + props.currentBook.key, "zip");
              toast.success(props.t("Deletion successful"));
            }}
          >
            <p className="action-name">
              <Trans>Delete pre-cache</Trans>
            </p>
          </div>
          <div
            className="action-dialog-edit"
            style={{ paddingLeft: "0px" }}
            onClick={() => {
              const link = `koodo-reader://open-book?bookKey=${props.currentBook.key}`;
              navigator.clipboard.writeText(link).then(() => {
                toast.success(props.t("Copied"));
              });
              props.handleMoreAction(false);
              props.handleActionDialog(false);
            }}
          >
            <p className="action-name">
              <Trans>Copy book link</Trans>
            </p>
          </div>
          {isElectron && (
            <div
              className="action-dialog-edit"
              style={{ paddingLeft: "0px" }}
              onClick={async () => {
                const fs = window.electronAPI.fs;
                const path = window.electronAPI.path;
                const localBookPath = props.currentBook.path;

                const libraryBookPath = path.join(
                  getStorageLocation() || "",
                  `book`,
                  props.currentBook.key +
                    "." +
                    props.currentBook.format.toLowerCase()
                );
                if (
                  !fs.existsSync(localBookPath) &&
                  !fs.existsSync(libraryBookPath)
                ) {
                  toast.error(props.t("No path found for this book"));
                  return;
                }
                if (fs.existsSync(localBookPath)) {
                  const ipcRenderer = window.electronAPI;
                  ipcRenderer.invoke("open-explorer-folder", {
                    path: localBookPath,
                    isFolder: false,
                  });
                } else {
                  const ipcRenderer = window.electronAPI;
                  ipcRenderer.invoke("open-explorer-folder", {
                    path: libraryBookPath,
                    isFolder: false,
                  });
                }
              }}
            >
              <p className="action-name">
                <Trans>Locate in the folder</Trans>
              </p>
            </div>
          )}
        </div>
      </div>
      {renderFormatSubmenu("notes")}
      {renderFormatSubmenu("highlights")}
      {renderFormatSubmenu("words")}
    </>
  );
};

export default MoreAction;
