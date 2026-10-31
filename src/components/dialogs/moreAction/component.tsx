import { useTranslation } from "react-i18next";
import { useState } from "react";
import "./moreAction.css";
import { Trans } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";
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

import BookModel from "../../../models/Book";

export interface MoreActionProps {
  book: BookModel;

  left: number;
  top: number;

  isShowExport: boolean;
  isShowDetail: boolean;
  isExceed: boolean;

  handleMoreAction: (isShow: boolean) => void;
  handleFetchBookmarks: () => void;
  handleFetchNotes: () => void;
}

export interface MoreActionState {
  exportSubmenu?: string;
}

declare var window: any;

const MoreAction = (
  props: Pick<
    MoreActionProps,
    "left" | "top" | "isShowExport" | "isExceed" | "handleMoreAction"
  >
) => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const handleActionDialog = useAppStore((s) => s.handleActionDialog);
  const { t } = useTranslation();
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
          currentBook.key,
          isWords ? "words" : "notes"
        )
      ).filter(filterFn);
      if (records.length > 0) {
        const result = await exportFn(records, books, format);
        if (result === "success") {
          toast.success(t("Export successful"), { id: "exporting" });
        } else if (result === "failed") {
          toast.error(t("Failed to export"), { id: "exporting" });
        }
      } else {
        toast(t("Nothing to export"));
      }
      setState((prev) => ({ ...prev, exportSubmenu: "" }));
      props.handleMoreAction(false);
      handleActionDialog(false);
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
          handleActionDialog(false);
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
            handleActionDialog(false);
          }
        }}
        onMouseEnter={(event) => {
          props.handleMoreAction(true);
          handleActionDialog(true);
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
              handleActionDialog(false);
              const result = await exportBookPackage([currentBook]);
              if (result === "success") {
                toast.success(t("Export successful"), {
                  id: "exporting",
                });
              } else if (result === "failed") {
                toast.dismiss("exporting");
                toast.error(t("Failed to export"), {
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
                currentBook.key,
                currentBook.format.toLowerCase(),
                true,
                currentBook.path
              ).then((result: any) => {
                toast.success(t("Export successful"), {
                  id: "exporting",
                });
                saveAs(new Blob([result]), getBookName(currentBook));
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
                currentBook
              );
              if (!isCoverExist) {
                toast(t("Nothing to export"));
                return;
              }
              const cover = await CoverUtil.getCover(currentBook);
              if (cover.startsWith("blob:") || cover.startsWith("asset:")) {
                const response = await fetch(cover);
                const blob = await response.blob();
                const ext = blob.type.split("/")[1] || "jpg";
                saveAs(blob, `${currentBook.name}.${ext}`);
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
                  `${currentBook.name}.${ext}`
                );
              } else if (isElectron) {
                const fs = window.electronAPI.fs;
                const ext = cover.split(".").pop() || "jpg";
                const buffer = fs.readFileSync(cover);
                saveAs(
                  new Blob([buffer], { type: `image/${ext}` }),
                  `${currentBook.name}.${ext}`
                );
              }
              toast.success(t("Export successful"), {
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
                currentBook.format === "PDF" ||
                isFixedLayoutBook(currentBook)
              ) {
                toast(t("Not supported yet"));
                return;
              }
              toast(t("Pre-caching"));
              BookUtil.fetchBook(
                currentBook.key,
                currentBook.format.toLowerCase(),
                true,
                currentBook.path
              ).then(async (result: any) => {
                let rendition = BookHelper.getRendition(
                  result,
                  {
                    format: currentBook.format,
                    readerMode: "",
                    charset: currentBook.charset,
                    animation:
                      ConfigService.getReaderConfig("animation") || "none",
                    convertChinese:
                      ConfigService.getReaderConfig("convertChinese"),
                    bookLayout: ConfigService.getReaderConfig("bookLayout"),
                    textRules: getTextRules(currentBook.key),
                    codeHighlight:
                      ConfigService.getReaderConfig("codeHighlight") || "",
                    fullTranslationMode: "no",
                    textOrientation:
                      ConfigService.getReaderConfig("textOrientation"),
                    parserRegex: "",
                    isDarkMode: "no",
                    isMobile: "no",
                    password: getPdfPassword(currentBook),
                    isScannedPDF: "no",
                    isKeepPDFBackground: "no",
                  },
                  Kookit
                );
                let cache = await rendition.preCache(result);
                if (cache !== "err" || cache) {
                  await BookUtil.addBook(
                    "cache-" + currentBook.key,
                    "zip",
                    cache
                  );
                  toast.success(t("Pre-caching successful"), {
                    id: "add-book",
                  });
                } else {
                  toast.error(t("Pre-caching failed"), {
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
              await BookUtil.deleteBook("cache-" + currentBook.key, "zip");
              toast.success(t("Deletion successful"));
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
              const link = `koodo-reader://open-book?bookKey=${currentBook.key}`;
              navigator.clipboard.writeText(link).then(() => {
                toast.success(t("Copied"));
              });
              props.handleMoreAction(false);
              handleActionDialog(false);
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
                const localBookPath = currentBook.path;

                const libraryBookPath = path.join(
                  getStorageLocation() || "",
                  `book`,
                  currentBook.key +
                    "." +
                    currentBook.format.toLowerCase()
                );
                if (
                  !fs.existsSync(localBookPath) &&
                  !fs.existsSync(libraryBookPath)
                ) {
                  toast.error(t("No path found for this book"));
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
