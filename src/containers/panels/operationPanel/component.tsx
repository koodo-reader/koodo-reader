import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import "./operationPanel.css";
import Bookmark from "../../../models/Bookmark";
import { Trans } from "react-i18next";

import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import TTSUtil from "../../../utils/reader/ttsUtil";
import { isElectron } from "react-device-detect";
import { handleExitFullScreen, handleFullScreen } from "../../../utils/common";
import DatabaseService from "../../../utils/storage/databaseService";
import BookLocation from "../../../models/BookLocation";
import { useAppStore } from "../../../store/useAppStore";

export interface OperationPanelProps {
  rendition: any;
  currentDuration: number;
}

declare var window: any;

const OperationPanel = (props: OperationPanelProps) => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const htmlBook = useAppStore((s) => s.reader.htmlBook);
  const handleReadingState = useAppStore((s) => s.handleReadingState);
  const handleFetchBookmarks = useAppStore((s) => s.handleFetchBookmarks);
  const handleShowBookmark = useAppStore((s) => s.handleShowBookmark);
  const handleSearch = useAppStore((s) => s.handleSearch);
  const handleHtmlBook = useAppStore((s) => s.handleHtmlBook);
  const { t } = useTranslation();
  const [state, setState] = useState<Record<string, any>>({
    timeLeft: 0,
    isFullscreen: ConfigService.getReaderConfig("isFullscreen") === "yes",
  });
  const timeStampRef = useRef(Date.now());
  const speedRef = useRef(30000);

  const handleFullscreenChange = () => {
    const isNowFullscreen = !!document.fullscreenElement;
    if (!isNowFullscreen) {
      ConfigService.setReaderConfig("isFullscreen", "no");
    }
    setState((prev) => ({ ...prev, isFullscreen: isNowFullscreen }));
  };

  const handleDisplayBookmark = async () => {
    handleShowBookmark(false);
    let bookLocation: {
      text: string;
      count: string;
      chapterTitle: string;
      chapterDocIndex: string;
      chapterHref: string;
      percentage: string;
      cfi: string;
    } = ConfigService.getObjectConfig(
      currentBook.key,
      "recordLocation",
      {}
    );
    let bookmarks = await DatabaseService.getRecordsByBookKey(
      currentBook.key,
      "bookmarks"
    );
    bookmarks.forEach((item) => {
      if (item.cfi === JSON.stringify(bookLocation)) {
        handleShowBookmark(true);
      }
    });
  };

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    const onPageChanged = async () => {
      speedRef.current = Date.now() - timeStampRef.current;
      timeStampRef.current = Date.now();
      let pageProgress = await htmlBook.rendition.getProgress();
      setState((prev) => ({
        ...prev,
        timeLeft:
          ((pageProgress.totalPage - pageProgress.currentPage) *
            speedRef.current) /
          1000,
      }));
      handleDisplayBookmark();
    };
    htmlBook.rendition.on("page-changed", onPageChanged);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      htmlBook.rendition.off?.("page-changed", onPageChanged);
    };
  }, []);

  const handleScreen = () => {
    const entering = ConfigService.getReaderConfig("isFullscreen") !== "yes";
    entering ? handleFullScreen() : handleExitFullScreen();
    if (entering) {
      ConfigService.setReaderConfig("isFullscreen", "yes");
      setState((prev) => ({ ...prev, isFullscreen: true }));
    } else {
      ConfigService.setReaderConfig("isFullscreen", "no");
      setState((prev) => ({ ...prev, isFullscreen: false }));
    }
  };

  const handleExit = async () => {
    ConfigService.setReaderConfig("isFullscreen", "no");
    handleReadingState(false);
    handleSearch(false);
    window.speechSynthesis && window.speechSynthesis.cancel();
    TTSUtil.pauseAudio();
    handleExitFullScreen();
    if (htmlBook) {
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
    let bookKey = currentBook.key;
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
      currentBook.key,
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

  return (
    <div className="book-operation-panel">
      <div className="book-opeartion-info">
        <span>
          <Trans
            i18nKey="Current reading time"
            count={Math.floor(Math.abs(Math.floor(props.currentDuration / 60)))}
          >
            Current reading time:
            {{
              count: Math.abs(Math.floor(props.currentDuration / 60)),
            }}
            min
          </Trans>
        </span>
        &nbsp;&nbsp;&nbsp;
        <span>
          <Trans
            i18nKey="Remaining reading time"
            count={Math.ceil(state.timeLeft / 60)}
          >
            Remaining reading time:
            {{
              count: `${Math.ceil(state.timeLeft / 60)}`,
            }}
            min
          </Trans>
        </span>
      </div>
      <div
        className="exit-reading-button"
        onClick={() => {
          handleExit();
        }}
      >
        <div className="operation-button-container">
          <div style={{ display: "flex", alignItems: "center" }}>
            <span className="icon-exit exit-reading-icon"></span>
            <span className="exit-reading-text">
              <Trans>Exit</Trans>
            </span>
          </div>
        </div>
      </div>
      <div
        className="add-bookmark-button"
        onClick={() => {
          handleAddBookmark();
        }}
      >
        <div className="operation-button-container">
          <div style={{ display: "flex", alignItems: "center" }}>
            <span className="icon-add add-bookmark-icon"></span>
            <span className="add-bookmark-text">
              <Trans>Bookmark</Trans>
            </span>
          </div>
        </div>
      </div>
      <div
        className="enter-fullscreen-button"
        onClick={() => {
          handleScreen();
        }}
      >
        <div className="operation-button-container">
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              className={`${state.isFullscreen ? "icon-collapse" : "icon-fullscreen"} enter-fullscreen-icon`}
            ></span>
            <span className="enter-fullscreen-text">
              {state.isFullscreen ? (
                <Trans>Exit full screen</Trans>
              ) : (
                <Trans>Full screen</Trans>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationPanel;
