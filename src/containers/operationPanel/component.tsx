//顶部图书操作面板
import React from "react";
import "./operationPanel.css";
import Bookmark from "../../model/Bookmark";
import { Trans } from "react-i18next";
import localforage from "localforage";
import RecordLocation from "../../utils/recordLocation";
import { OperationPanelProps, OperationPanelState } from "./interface";
import OtherUtil from "../../utils/otherUtil";
import ReadingTime from "../../utils/readingTime";
import { withRouter } from "react-router-dom";

declare var document: any;

class OperationPanel extends React.Component<
  OperationPanelProps,
  OperationPanelState
> {
  timeStamp: number;
  speed: number;
  constructor(props: OperationPanelProps) {
    super(props);
    this.state = {
      isFullScreen:
        OtherUtil.getReaderConfig("isFullScreen") === "yes" ? true : false, // 是否进入全屏模式
      isBookmark: false, // 是否添加书签
      time: 0,
      currentPercentage: RecordLocation.getCfi(this.props.currentBook.key)
        ? RecordLocation.getCfi(this.props.currentBook.key).percentage
        : 0,
      timeLeft: 0,
    };
    this.timeStamp = Date.now();
    this.speed = 30000;
  }
  componentWillReceiveProps(nextProps: OperationPanelProps) {
    if (
      nextProps.currentEpub.rendition &&
      nextProps.currentEpub.rendition.location
    ) {
      const currentLocation = this.props.currentEpub.rendition.currentLocation();
      if (!currentLocation.start) {
        return;
      }
      if (
        this.props.currentEpub.rendition.currentLocation().percentage !==
        nextProps.currentEpub.rendition.currentLocation().percentage
      ) {
        this.speed = Date.now() - this.timeStamp;
        this.timeStamp = Date.now();
      }
      this.setState({
        timeLeft:
          ((currentLocation.start.displayed.total -
            currentLocation.start.displayed.page) *
            this.speed) /
          1000,
      });
      // let nextPercentage = section.start.percentage;
    }
  }
  // 点击切换全屏按钮触发
  handleScreen() {
    !this.state.isFullScreen
      ? this.handleFullScreen()
      : this.handleExitFullScreen();
  }
  //控制进入全屏
  handleFullScreen() {
    let de: any = document.documentElement;
    if (de.requestFullscreen) {
      de.requestFullscreen();
    } else if (de.mozRequestFullScreen) {
      de.mozRequestFullScreen();
    } else if (de.webkitRequestFullscreen) {
      de.webkitRequestFullscreen();
    } else if (de.msRequestFullscreen) {
      de.msRequestFullscreen();
    }

    this.setState({ isFullScreen: true });
    OtherUtil.setReaderConfig("isFullScreen", "yes");
  }

  // 退出全屏模式
  handleExitFullScreen() {
    //解决使用esc退出全屏，再退出阅读时发生的bug
    if (!document.fullscreenElement) return;

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }

    this.setState({ isFullScreen: false });
    OtherUtil.setReaderConfig("isFullScreen", "no");
  }
  handleAddBookmark() {
    let bookKey = this.props.currentBook.key;
    const currentLocation = this.props.currentEpub.rendition.currentLocation();
    let chapterHref = currentLocation.start.href;
    let chapter = "Unknown Chapter";
    let currentChapter = this.props.flattenChapters.filter(
      (item: any) =>
        chapterHref.indexOf(item.href.split("#")[0]) > -1 ||
        item.href.split("#")[0].indexOf(chapterHref) > -1
    )[0];
    if (currentChapter) {
      chapter = currentChapter.label.trim(" ");
    }
    const cfibase = currentLocation.start.cfi
      .replace(/!.*/, "")
      .replace("epubcfi(", "");
    const cfistart = currentLocation.start.cfi
      .replace(/.*!/, "")
      .replace(/\)/, "");
    const cfiend = currentLocation.end.cfi.replace(/.*!/, "").replace(/\)/, "");
    const cfiRange = `epubcfi(${cfibase}!,${cfistart},${cfiend})`;
    const cfi = RecordLocation.getCfi(this.props.currentBook.key).cfi;
    this.props.currentEpub.getRange(cfiRange).then((range: any) => {
      if (!range) return;
      let text = range.toString();
      text = text.replace(/\s\s/g, "");
      text = text.replace(/\r/g, "");
      text = text.replace(/\n/g, "");
      text = text.replace(/\t/g, "");
      text = text.replace(/\f/g, "");
      let percentage = RecordLocation.getCfi(this.props.currentBook.key)
        .percentage
        ? RecordLocation.getCfi(this.props.currentBook.key).percentage
        : 0;
      let bookmark = new Bookmark(bookKey, cfi, text, percentage, chapter);
      let bookmarkArr = this.props.bookmarks ?? [];
      bookmarkArr.push(bookmark);
      this.props.handleBookmarks(bookmarkArr);
      localforage.setItem("bookmarks", bookmarkArr);
      this.setState({ isBookmark: true });
      this.props.handleMessage("Add Successfully");
      this.props.handleMessageBox(true);
      this.props.handleShowBookmark(true);
    });
  }

  // 点击退出按钮的处理程序
  handleExit() {
    OtherUtil.setReaderConfig("isFullScreen", "no");
    window.speechSynthesis && window.speechSynthesis.cancel();
    if (this.state.isFullScreen) {
      this.handleExitFullScreen();
    }
    this.props.handleSearch(false);
    this.props.handleOpenMenu(false);
    ReadingTime.setTime(this.props.currentBook.key, this.props.time);
    window.close();
    // this.props.history.push("/manager/home");
  }

  render() {
    return (
      <div className="book-operation-panel">
        <div className="book-opeartion-info">
          <span>
            <Trans
              i18nKey="Current Reading Time"
              count={Math.floor(
                (this.props.time -
                  ReadingTime.getTime(this.props.currentBook.key)) /
                  60
              )}
            >
              Current Reading Time:
              {{
                count: Math.abs(
                  Math.floor(
                    (this.props.time -
                      ReadingTime.getTime(this.props.currentBook.key)) /
                      60
                  )
                ),
              }}
              Minutes
            </Trans>
          </span>
          &nbsp;&nbsp;&nbsp;
          <span>
            <Trans
              i18nKey="Finish Reading Time"
              count={Math.ceil(this.state.timeLeft / 60)}
            >
              Finish Reading Time:
              {{
                count: `${Math.ceil(this.state.timeLeft / 60)}`,
              }}
              Minutes
            </Trans>
          </span>
        </div>
        <div
          className="exit-reading-button"
          onClick={() => {
            this.handleExit();
          }}
        >
          <span className="icon-exit exit-reading-icon"></span>
          <span className="exit-reading-text">
            <Trans>Exit</Trans>
          </span>
        </div>
        <div
          className="add-bookmark-button"
          onClick={() => {
            this.handleAddBookmark();
          }}
        >
          <span className="icon-add add-bookmark-icon"></span>
          <span className="add-bookmark-text">
            <Trans>Add Bookmark</Trans>
          </span>
        </div>
        <div
          className="enter-fullscreen-button"
          onClick={() => {
            this.handleScreen();
          }}
        >
          <span className="icon-fullscreen enter-fullscreen-icon"></span>
          {!this.state.isFullScreen ? (
            <span className="enter-fullscreen-text">
              <Trans>Enter Fullscreen</Trans>
            </span>
          ) : (
            <span className="enter-fullscreen-text">
              <Trans>Exit Fullscreen</Trans>
            </span>
          )}
        </div>
      </div>
    );
  }
}

export default withRouter(OperationPanel);
