import React, { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { isElectron } from "react-device-detect";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import Bookmark from "../../models/Bookmark";
import BookLocation from "../../models/BookLocation";
import DatabaseService from "../../utils/storage/databaseService";
import TTSUtil from "../../utils/reader/ttsUtil";
import {
  handleExitFullScreen,
  handleFullScreen,
  isReadingRawPDF,
} from "../../utils/common";
import { useAppStore } from "../../store/useAppStore";
import WindowControls from "../windowControls";

export interface ReaderTopToolbarProps {
  isNearEdge: boolean;
  currentDuration: number;
  isMacOS: boolean;
  isMergeWord: boolean;
  isSeparateElectronWindow: boolean;
  showQuickButtons: () => void;
  hideQuickButtons: () => void;
  handleDialogButtonHover: (
    handleDialog: (isOpen: boolean) => void,
    dialogSelector: string
  ) => {
    onMouseEnter: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseLeave: () => void;
  };
  handleAnnotationClick: () => void;
  handleEnterReader: (position: string) => void;
}

declare var window: any;

const DRAG_REGION_STYLE = { WebkitAppRegion: "drag" } as React.CSSProperties;
const NO_DRAG_REGION_STYLE = {
  WebkitAppRegion: "no-drag",
} as React.CSSProperties;

const ReaderTopToolbar = (props: ReaderTopToolbarProps) => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const htmlBook = useAppStore((s) => s.reader.htmlBook);
  const readerMode = useAppStore((s) => s.reader.readerMode);
  const isSettingLocked = useAppStore((s) => s.reader.isSettingLocked);
  const isDockedRight = useAppStore((s) => s.reader.isDockedRight);
  const isAnnotationOpen = useAppStore((s) => s.reader.isAnnotationOpen);
  const handleStudyLangDialog = useAppStore((s) => s.handleStudyLangDialog);
  const handleAssistReadDialog = useAppStore((s) => s.handleAssistReadDialog);
  const handleScalePageDialog = useAppStore((s) => s.handleScalePageDialog);
  const handlePdfCropDialog = useAppStore((s) => s.handlePdfCropDialog);
  const handleConvertDialog = useAppStore((s) => s.handleConvertDialog);
  const handleSpeechDialog = useAppStore((s) => s.handleSpeechDialog);
  const handleMenuMode = useAppStore((s) => s.handleMenuMode);
  const handleOriginalText = useAppStore((s) => s.handleOriginalText);
  const handleOpenMenu = useAppStore((s) => s.handleOpenMenu);
  const handleReadingState = useAppStore((s) => s.handleReadingState);
  const handleFetchBookmarks = useAppStore((s) => s.handleFetchBookmarks);
  const handleShowBookmark = useAppStore((s) => s.handleShowBookmark);
  const handleSearch = useAppStore((s) => s.handleSearch);
  const handleHtmlBook = useAppStore((s) => s.handleHtmlBook);
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(
    ConfigService.getReaderConfig("isFullscreen") === "yes"
  );
  const timeStampRef = useRef(Date.now());
  const speedRef = useRef(30000);

  const handleFullscreenChange = () => {
    const isNowFullscreen = !!document.fullscreenElement;
    if (!isNowFullscreen) {
      ConfigService.setReaderConfig("isFullscreen", "no");
    }
    setIsFullscreen(isNowFullscreen);
  };

  const handleDisplayBookmark = async () => {
    const book = useAppStore.getState().book.currentBook;
    if (!book?.key) return;
    handleShowBookmark(false);
    let bookLocation: {
      text: string;
      count: string;
      chapterTitle: string;
      chapterDocIndex: string;
      chapterHref: string;
      percentage: string;
      cfi: string;
    } = ConfigService.getObjectConfig(book.key, "recordLocation", {});
    let bookmarks = await DatabaseService.getRecordsByBookKey(
      book.key,
      "bookmarks"
    );
    bookmarks.forEach((item) => {
      if (item.cfi === JSON.stringify(bookLocation)) {
        handleShowBookmark(true);
      }
    });
  };

  const handleScreen = () => {
    const entering = ConfigService.getReaderConfig("isFullscreen") !== "yes";
    entering ? handleFullScreen() : handleExitFullScreen();
    ConfigService.setReaderConfig("isFullscreen", entering ? "yes" : "no");
    setIsFullscreen(entering);
  };

  const handleExit = async () => {
    ConfigService.setReaderConfig("isFullscreen", "no");
    handleReadingState(false);
    handleSearch(false);
    window.speechSynthesis && window.speechSynthesis.cancel();
    TTSUtil.pauseAudio();
    handleExitFullScreen();
    if (useAppStore.getState().reader.htmlBook) {
      handleHtmlBook(null);
    }
    if (isElectron) {
      if (ConfigService.getReaderConfig("isOpenInMain") === "yes") {
        window.electronAPI.invoke("exit-tab", "ping");
      } else {
        window.electronAPI.invoke("exit-reader", "ping");
      }
    } else {
      ConfigService.setReaderConfig("isFinishWebReading", "yes");
      window.close();
    }
  };

  const handleAddBookmark = async () => {
    const state = useAppStore.getState();
    const book = state.book.currentBook;
    const htmlBook = state.reader.htmlBook;
    if (!book?.key || !htmlBook) return;
    let bookKey = book.key;
    let bookLocation: BookLocation = ConfigService.getObjectConfig(
      bookKey,
      "recordLocation",
      {}
    );
    let text = bookLocation.text;
    let chapter = bookLocation.chapterTitle;
    let percentage = bookLocation.percentage;
    let isDuplicate = false;
    let bookmarks = await DatabaseService.getRecordsByBookKey(
      bookKey,
      "bookmarks"
    );
    for (let i = 0; i < bookmarks.length; i++) {
      if (
        bookmarks[i].percentage === bookLocation.percentage &&
        bookmarks[i].page === bookLocation.page
      ) {
        isDuplicate = true;
        break;
      }
    }
    if (isDuplicate) {
      toast.error(t("Bookmark already exists"));
      return;
    }

    let cfi = JSON.stringify(bookLocation);
    if (!text) {
      text = (await htmlBook.rendition.visibleText()).join(" ");
    }
    text = text
      .replace(/\s\s/g, "")
      .replace(/\r/g, "")
      .replace(/\n/g, "")
      .replace(/\t/g, "")
      .replace(/\f/g, "");

    let bookmark = new Bookmark(
      bookKey,
      cfi,
      text.substr(0, 200),
      percentage,
      chapter
    );
    await DatabaseService.saveRecord(bookmark, "bookmarks");
    handleFetchBookmarks();
    handleShowBookmark(true);
  };

  useEffect(() => {
    if (!htmlBook) return;
    const rendition = htmlBook.rendition;
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    const onPageChanged = async () => {
      speedRef.current = Date.now() - timeStampRef.current;
      timeStampRef.current = Date.now();
      let pageProgress = await rendition.getProgress();
      setTimeLeft(
        ((pageProgress.totalPage - pageProgress.currentPage) *
          speedRef.current) /
          1000
      );
      handleDisplayBookmark();
    };
    rendition.on("page-changed", onPageChanged);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      rendition.off?.("page-changed", onPageChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlBook]);

  const showCustomWindowControls =
    props.isSeparateElectronWindow && (!props.isMacOS || props.isMergeWord);

  return (
    <>
      {htmlBook && (
        <div
          style={{
            ...DRAG_REGION_STYLE,
            position: "absolute",
            top: 0,
            left:
              props.isMacOS &&
              !props.isMergeWord &&
              props.isSeparateElectronWindow
                ? 80
                : 15,
            zIndex: 14,
            height: 28,
            display: "flex",
            alignItems: "flex-start",
            opacity: props.isNearEdge ? 1 : 0,
            visibility: props.isNearEdge ? "visible" : "hidden",
            transition: "opacity 0.3s ease, visibility 0.3s ease",
            color: ConfigService.getReaderConfig("textColor") || "",
          }}
        >
          <div
            className="reader-setting-icon-container"
            style={props.isNearEdge ? NO_DRAG_REGION_STYLE : undefined}
            aria-label={t("Exit")}
            data-tooltip-id="my-tooltip"
            data-tooltip-content={t("Exit")}
            onClick={() => {
              handleExit();
            }}
          >
            <span
              className="icon-exit reader-setting-icon"
              style={{ fontSize: 18 }}
            ></span>
          </div>
          <div
            className="reader-setting-icon-container reader-toolbar-bookmark"
            style={props.isNearEdge ? NO_DRAG_REGION_STYLE : undefined}
            aria-label={t("Bookmark")}
            data-tooltip-id="my-tooltip"
            data-tooltip-content={t("Bookmark")}
            onClick={() => {
              handleAddBookmark();
            }}
          >
            <span
              className="icon-bookmark-line reader-setting-icon"
              style={{ fontSize: 19 }}
            ></span>
          </div>
          <div
            className="reader-setting-icon-container"
            style={props.isNearEdge ? NO_DRAG_REGION_STYLE : undefined}
            aria-label={t(isFullscreen ? "Exit full screen" : "Full screen")}
            data-tooltip-id="my-tooltip"
            data-tooltip-content={t(
              isFullscreen ? "Exit full screen" : "Full screen"
            )}
            onClick={() => {
              handleScreen();
            }}
          >
            <span
              className="icon-fullscreen-line reader-setting-icon"
              style={{ fontSize: 17 }}
            ></span>
          </div>
          <span
            className="reader-top-toolbar-time"
            style={{
              ...DRAG_REGION_STYLE,
              height: 28,
              display: "flex",
              alignItems: "center",
              fontSize: 13,
              lineHeight: "28px",
              whiteSpace: "nowrap",
              opacity: 0.9,
              marginTop: 12,
              marginLeft: 12,
            }}
          >
            <Trans
              i18nKey="Current reading time"
              count={Math.floor(
                Math.abs(Math.floor(props.currentDuration / 60))
              )}
            >
              Current reading time:
              {{
                count: Math.abs(Math.floor(props.currentDuration / 60)),
              }}
              min
            </Trans>
            &nbsp;&nbsp;
            <Trans
              i18nKey="Remaining reading time"
              count={Math.ceil(timeLeft / 60)}
            >
              Remaining reading time:
              {{
                count: `${Math.ceil(timeLeft / 60)}`,
              }}
              min
            </Trans>
          </span>
        </div>
      )}

      <div
        className="reader-quick-buttons"
        onMouseEnter={props.showQuickButtons}
        onMouseLeave={props.hideQuickButtons}
        style={{
          position: "absolute",
          top: "0px",
          right: isSettingLocked || isDockedRight ? 300 : 15,
          zIndex: 14,
          width: "max-content",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          opacity: props.isNearEdge ? 1 : 0,
          transition: "opacity 0.3s ease",
          color: ConfigService.getReaderConfig("textColor")
            ? ConfigService.getReaderConfig("textColor")
            : "",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {currentBook && !isReadingRawPDF(currentBook) && (
            <>
              <div
                className="reader-setting-icon-container"
                {...props.handleDialogButtonHover(
                  handleStudyLangDialog,
                  ".study-lang-dialog-container"
                )}
              >
                <span
                  className="icon-trans reader-setting-icon"
                  style={{ fontSize: 19 }}
                ></span>
              </div>
              <div
                className="reader-setting-icon-container"
                {...props.handleDialogButtonHover(
                  handleAssistReadDialog,
                  ".assist-read-dialog-container"
                )}
              >
                <span
                  className="icon-light-bulb reader-setting-icon"
                  style={{ fontSize: 20 }}
                ></span>
              </div>
            </>
          )}
          {(readerMode === "scroll" || readerMode === "single") && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <div
                className="reader-setting-icon-container"
                {...props.handleDialogButtonHover(
                  handleScalePageDialog,
                  ".scale-page-dialog-container"
                )}
              >
                <span
                  className="icon-zoom-in reader-setting-icon"
                  style={{ fontSize: 20 }}
                ></span>
              </div>
            </div>
          )}

          {currentBook.format === "PDF" && readerMode === "scroll" && (
            <div
              className="reader-setting-icon-container"
              {...props.handleDialogButtonHover(
                handlePdfCropDialog,
                ".pdf-crop-dialog-container"
              )}
            >
              <span
                className="icon-crop reader-setting-icon"
                style={{ fontSize: 20 }}
              ></span>
            </div>
          )}

          {currentBook.format === "PDF" && (
            <div
              className="reader-setting-icon-container"
              {...props.handleDialogButtonHover(
                handleConvertDialog,
                ".convert-dialog-container"
              )}
            >
              <span
                className="icon-convert-text reader-setting-icon"
                style={{ fontSize: 22 }}
              ></span>
            </div>
          )}
          <div
            className="reader-setting-icon-container"
            {...props.handleDialogButtonHover(
              handleSpeechDialog,
              ".speech-dialog-container"
            )}
          >
            <span
              className={`icon-earphone-line reader-setting-icon`}
              style={{ fontSize: 20 }}
            ></span>
          </div>

          <div
            className="reader-setting-icon-container"
            style={{
              display:
                currentBook &&
                isReadingRawPDF(currentBook) &&
                currentBook.description?.indexOf("scanned") > -1
                  ? undefined
                  : "none",
            }}
            aria-label={t("Annotation")}
            data-tooltip-id="my-tooltip"
            data-tooltip-content={t("Annotation")}
            onClick={props.handleAnnotationClick}
          >
            <span
              className={`icon-pen-line reader-setting-icon`}
              style={{ fontSize: 20 }}
            ></span>
          </div>
          {ConfigService.getReaderConfig("isDisableAI") !== "yes" && (
            <div
              className="reader-setting-icon-container"
              aria-label={t("Reading Assistant")}
              data-tooltip-id="my-tooltip"
              data-tooltip-content={t("Reading Assistant")}
              onClick={async () => {
                if (!htmlBook) return;
                handleMenuMode("assistant");
                handleOriginalText(await htmlBook.rendition.chapterText());
                handleOpenMenu(true);
              }}
            >
              <span
                className={`icon-star-line reader-setting-icon`}
                style={{ fontSize: 20 }}
              ></span>
            </div>
          )}
          <div
            className="reader-setting-icon-container"
            aria-label={t("Toggle menu")}
            data-tooltip-id="my-tooltip"
            data-tooltip-content={t("Toggle menu")}
            onClick={() => {
              props.handleEnterReader("left");
              props.handleEnterReader("right");
            }}
          >
            <span
              className="icon-grid reader-setting-icon"
              style={{ fontSize: 16 }}
            ></span>
          </div>
          {showCustomWindowControls && <WindowControls t={t} />}
        </div>
      </div>
    </>
  );
};

export default ReaderTopToolbar;
