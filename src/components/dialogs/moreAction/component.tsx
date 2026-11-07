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
  CONTEXT_MENU_ITEM_HEIGHT,
  CONTEXT_MENU_PADDING,
  CONTEXT_MENU_WIDTH,
  estimateMenuHeight,
  getSubmenuPosition,
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
  menuItemIndex?: number;

  handleMoreAction: (isShow: boolean) => void;
  handleMenuEnter: () => void;
  handleMenuLeave: () => void;
  handleFetchBookmarks: () => void;
  handleFetchNotes: () => void;
}

export interface MoreActionState {
  exportSubmenu?: string;
}

declare var window: any;

const DEFAULT_MENU_INDEX = 9;
const EXPORT_MENU_ITEM_INDEX = {
  notes: 3,
  highlights: 4,
  words: 5,
};

const MoreAction = (
  props: Pick<
    MoreActionProps,
    | "left"
    | "top"
    | "isShowExport"
    | "isExceed"
    | "menuItemIndex"
    | "handleMoreAction"
    | "handleMenuEnter"
    | "handleMenuLeave"
  >
) => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const handleActionDialog = useAppStore((s) => s.handleActionDialog);
  const { t } = useTranslation();
  const [state, setState] = useState<MoreActionState>({ exportSubmenu: "" });

  const moreMenuItemCount = isElectron ? 10 : 9;
  const moreMenuHeight = estimateMenuHeight(moreMenuItemCount);
  const moreMenuLeft = props.left + (props.isExceed ? -SUBMENU_GAP : SUBMENU_GAP);
  // “更多操作”在主菜单中的实际行位置，子菜单必须以这一行为锚点，
  // 而不是沿用写死的偏移，否则靠近底部时子菜单会被推到触发行上方。
  const moreMenuTriggerTop =
    props.top +
    CONTEXT_MENU_PADDING +
    (props.menuItemIndex ?? DEFAULT_MENU_INDEX) * CONTEXT_MENU_ITEM_HEIGHT;
  const moreMenuPos = getSubmenuPosition(
    moreMenuLeft,
    moreMenuTriggerTop,
    CONTEXT_MENU_ITEM_HEIGHT,
    CONTEXT_MENU_WIDTH,
    moreMenuHeight
  );

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

    const formatSubmenuHeight = estimateMenuHeight(isWords ? 2 : 6);
    // 格式子菜单以“导出笔记/导出高亮/导出查词历史”所在行的实际渲染位置为锚点，
    // 主菜单向上翻转时也要保持一致的对齐。
    const formatTriggerTop =
      moreMenuPos.top +
      CONTEXT_MENU_PADDING +
      EXPORT_MENU_ITEM_INDEX[type] * CONTEXT_MENU_ITEM_HEIGHT;
    const formatSubmenuPos = getSubmenuPosition(
      props.left +
        (props.isExceed ? -SUBMENU_GAP : SUBMENU_GAP) +
        SUBMENU_GAP,
      formatTriggerTop,
      CONTEXT_MENU_ITEM_HEIGHT,
      120,
      formatSubmenuHeight
    );

    return (
      <div
        className="action-dialog-container export-format-submenu-action"
        style={
          isVisible
            ? {
                position: "fixed",
                left: formatSubmenuPos.left,
                top: formatSubmenuPos.top,
                zIndex: 10,
              }
            : { display: "none" }
        }
        onMouseEnter={() => {
          props.handleMenuEnter();
          setState((prev) => ({ ...prev, exportSubmenu: type }));
        }}
        onMouseLeave={() => {
          setState((prev) => ({ ...prev, exportSubmenu: "" }));
          props.handleMoreAction(false);
          props.handleMenuLeave();
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
            props.handleMenuLeave();
          }
        }}
        onMouseEnter={(event) => {
          props.handleMenuEnter();
          props.handleMoreAction(true);
          handleActionDialog(true);
          event?.stopPropagation();
        }}
        style={
          props.isShowExport
            ? {
                position: "fixed",
                left: moreMenuPos.left,
                top: moreMenuPos.top,
              }
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
