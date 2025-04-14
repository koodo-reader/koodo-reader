import React from "react";
import "./operationPanel.css";
import Bookmark from "../../../models/Bookmark";
import { Trans } from "react-i18next";

import { OperationPanelProps, OperationPanelState } from "./interface";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { withRouter } from "react-router-dom";
import toast from "react-hot-toast";
import { HtmlMouseEvent } from "../../../utils/reader/mouseEvent";
import TTSUtil from "../../../utils/reader/ttsUtil";
import { isElectron } from "react-device-detect";
import { handleExitFullScreen, handleFullScreen } from "../../../utils/common";
import DatabaseService from "../../../utils/storage/databaseService";
import BookLocation from "../../../models/BookLocation";
declare var window: any;
class OperationPanel extends React.Component<
  OperationPanelProps,
  OperationPanelState
> {
  timeStamp: number;
  speed: number;
  timer: any;

  constructor(props: OperationPanelProps) {
    super(props);
    this.state = {
      isBookmark: false,
      time: 0,
      currentPercentage: ConfigService.getObjectConfig(
        this.props.currentBook.key,
        "recordLocation",
        {}
      )
        ? ConfigService.getObjectConfig(
            this.props.currentBook.key,
            "recordLocation",
            {}
          ).percentage
        : 0,
      timeLeft: 0,
    };
    this.timeStamp = Date.now();
    this.speed = 30000;
  }

  componentDidMount() {
    this.props.htmlBook.rendition.on("page-changed", async () => {
      this.speed = Date.now() - this.timeStamp;
      this.timeStamp = Date.now();
      let pageProgress = await this.props.htmlBook.rendition.getProgress();
      this.setState({
        timeLeft:
          ((pageProgress.totalPage - pageProgress.currentPage) * this.speed) /
          1000,
      });
      this.handleDisplayBookmark();

      HtmlMouseEvent(
        this.props.htmlBook.rendition,
        this.props.currentBook.key,
        this.props.readerMode,
        this.props.currentBook.format
      );
    });
  }

  handleShortcut() {}
  handleScreen() {
    ConfigService.getReaderConfig("isFullscreen") !== "yes"
      ? handleFullScreen()
      : handleExitFullScreen();
    if (ConfigService.getReaderConfig("isFullscreen") === "yes") {
      ConfigService.setReaderConfig("isFullscreen", "no");
    } else {
      ConfigService.setReaderConfig("isFullscreen", "yes");
    }
  }
  handleExit() {
    ConfigService.setReaderConfig("isFullscreen", "no");
    this.props.handleReadingState(false);
    this.props.handleSearch(false);
    window.speechSynthesis && window.speechSynthesis.cancel();
    TTSUtil.pauseAudio();
    handleExitFullScreen();
    if (this.props.htmlBook) {
      this.props.handleHtmlBook(null);
    }

    if (isElectron) {
      if (ConfigService.getReaderConfig("isOpenInMain") === "yes") {
        window.require("electron").ipcRenderer.invoke("exit-tab", "ping");
      } else {
        window.close();
      }
    } else {
      window.close();
    }
  }
  handleAddBookmark = async () => {
    let bookKey = this.props.currentBook.key;
    let bookLocation: BookLocation = ConfigService.getObjectConfig(
      bookKey,
      "recordLocation",
      {}
    );
    let text = bookLocation.text;
    let chapter = bookLocation.chapterTitle;
    let percentage = bookLocation.percentage;

    let cfi = JSON.stringify(bookLocation);
    if (!text) {
      text = (await this.props.htmlBook.rendition.visibleText()).join(" ");
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
    this.props.handleFetchBookmarks();
    this.setState({ isBookmark: true });
    toast.success(this.props.t("Addition successful"));
    this.props.handleShowBookmark(true);
  };
  handleDisplayBookmark() {
    this.props.handleShowBookmark(false);
    let bookLocation: {
      text: string;
      count: string;
      chapterTitle: string;
      chapterDocIndex: string;
      chapterHref: string;
      percentage: string;
      cfi: string;
    } = ConfigService.getObjectConfig(
      this.props.currentBook.key,
      "recordLocation",
      {}
    );
    this.props.bookmarks.forEach((item) => {
      if (item.cfi === JSON.stringify(bookLocation)) {
        this.props.handleShowBookmark(true);
      }
    });
  }
  render() {
    return (
      <div className="book-operation-panel">
        <div className="book-opeartion-info">
          <span>
            <Trans
              i18nKey="Current reading time"
              count={Math.floor(
                Math.abs(Math.floor(this.props.currentDuration / 60))
              )}
            >
              Current reading time:
              {{
                count: Math.abs(Math.floor(this.props.currentDuration / 60)),
              }}
              min
            </Trans>
          </span>
          &nbsp;&nbsp;&nbsp;
          <span>
            <Trans
              i18nKey="Remaining reading time"
              count={Math.ceil(this.state.timeLeft / 60)}
            >
              Remaining reading time:
              {{
                count: `${Math.ceil(this.state.timeLeft / 60)}`,
              }}
              min
            </Trans>
          </span>
        </div>
        <div
          className="exit-reading-button"
          onClick={() => {
            this.handleExit();
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
            this.handleAddBookmark();
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
            if (isElectron) {
              this.handleScreen();
            } else {
              toast(
                this.props.t(
                  "Koodo Reader's web version are limited by the browser, for more powerful features, please download the desktop version."
                )
              );
            }
          }}
        >
          <div className="operation-button-container">
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className="icon-fullscreen enter-fullscreen-icon"></span>
              <span className="enter-fullscreen-text">
                <Trans>Full screen</Trans>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(OperationPanel as any);
