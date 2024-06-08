import React from "react";
import "./operationPanel.css";
import Bookmark from "../../../model/Bookmark";
import { Trans } from "react-i18next";

import RecordLocation from "../../../utils/readUtils/recordLocation";
import { OperationPanelProps, OperationPanelState } from "./interface";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import ReadingTime from "../../../utils/readUtils/readingTime";
import { withRouter } from "react-router-dom";
import toast from "react-hot-toast";
import { HtmlMouseEvent } from "../../../utils/serviceUtils/mouseEvent";
import storageUtil from "../../../utils/serviceUtils/storageUtil";
import BingTTSUtil from "../../../utils/serviceUtils/bingTTSUtil";
import { isElectron } from "react-device-detect";
declare var document: any;
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
      isBookmark: false, // 是否添加书签
      time: 0,
      currentPercentage: RecordLocation.getHtmlLocation(
        this.props.currentBook.key
      )
        ? RecordLocation.getHtmlLocation(this.props.currentBook.key).percentage
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
        storageUtil.getReaderConfig("readerMode")
      );
    });
  }

  handleShortcut() {}
  // 点击切换全屏按钮触发
  handleScreen() {
    StorageUtil.getReaderConfig("isFullscreen") !== "yes"
      ? this.handleFullScreen()
      : this.handleExitFullScreen();
  }
  // 点击退出按钮的处理程序
  handleExit() {
    StorageUtil.setReaderConfig("isFullscreen", "no");
    this.props.handleReadingState(false);
    this.props.handleSearch(false);
    window.speechSynthesis.cancel();
    BingTTSUtil.pauseAudio();
    ReadingTime.setTime(this.props.currentBook.key, this.props.time);
    this.handleExitFullScreen();
    if (this.props.htmlBook) {
      this.props.handleHtmlBook(null);
    }

    if (isElectron) {
      if (StorageUtil.getReaderConfig("isOpenInMain") === "yes") {
        window.require("electron").ipcRenderer.invoke("exit-tab", "ping");
      } else {
        window.close();
      }
    } else {
      window.close();
    }
  }
  //控制进入全屏
  handleFullScreen() {
    if (isElectron) {
      if (StorageUtil.getReaderConfig("isOpenInMain") === "yes") {
        window
          .require("electron")
          .ipcRenderer.invoke("enter-tab-fullscreen", "ping");
      } else {
        window
          .require("electron")
          .ipcRenderer.invoke("enter-fullscreen", "ping");
      }
    } else {
      let de: any = document.documentElement;
      if (de.requestFullscreen) {
        de.requestFullscreen();
      }
    }

    StorageUtil.setReaderConfig("isFullscreen", "yes");
  }
  // 退出全屏模式
  handleExitFullScreen() {
    if (isElectron) {
      if (StorageUtil.getReaderConfig("isOpenInMain") === "yes") {
        window
          .require("electron")
          .ipcRenderer.invoke("exit-tab-fullscreen", "ping");
      } else {
        window
          .require("electron")
          .ipcRenderer.invoke("exit-fullscreen", "ping");
      }
    } else {
      //解决使用esc退出全屏，再退出阅读时发生的bug
      if (!document.fullscreenElement) return;

      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }

    StorageUtil.setReaderConfig("isFullscreen", "no");
  }
  handleAddBookmark = () => {
    let bookKey = this.props.currentBook.key;
    let bookLocation = RecordLocation.getHtmlLocation(bookKey);
    let text = bookLocation.text;
    let chapter = bookLocation.chapterTitle;
    let percentage = bookLocation.percentage;

    let cfi = JSON.stringify(bookLocation);
    if (!text) {
      text = this.props.htmlBook.rendition.visibleText().join(" ");
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
    let bookmarkArr = this.props.bookmarks;
    bookmarkArr.push(bookmark);
    this.props.handleBookmarks(bookmarkArr);
    window.localforage.setItem("bookmarks", bookmarkArr);
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
    } = RecordLocation.getHtmlLocation(this.props.currentBook.key);
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
              count={Math.floor(Math.abs(Math.floor(this.props.time / 60)))}
            >
              Current reading time:
              {{
                count: Math.abs(Math.floor(this.props.time / 60)),
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
            this.handleScreen();
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
