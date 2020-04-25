//图书操作页面
import React from "react";
import "./operationPanel.css";
import Bookmark from "../../model/Bookmark";
import { connect } from "react-redux";
import {
  handleBookmarks,
  handleFetchBookmarks,
} from "../../redux/reader.redux";
import { handleMessageBox, handleMessage } from "../../redux/manager.redux";
import { handleReadingState } from "../../redux/book.redux";
import localforage from "localforage";
import RecordLocation from "../../utils/recordLocation";
import BookModel from "../../model/Book";
import BookmarkModel from "../../model/Bookmark";
declare var document: any;
export interface OperationPanelProps {
  currentEpub: any;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  chapters: any;
  handleBookmarks: (bookmarks: BookmarkModel[]) => void;
  handleReadingState: (isReading: boolean) => void;
  handleFetchBookmarks: () => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}

export interface OperationPanelState {
  isFullScreen: boolean;
  isBookmark: boolean;
}

class OperationPanel extends React.Component<
  OperationPanelProps,
  OperationPanelState
> {
  constructor(props: OperationPanelProps) {
    super(props);
    this.state = {
      isFullScreen:
        localStorage.getItem("isFullScreen") === "yes" ? true : false, // 是否进入全屏模式
      isBookmark: false, // 是否添加书签
    };
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
    localStorage.setItem("isFullScreen", "yes");
  }

  // 退出全屏模式
  handleExitFullScreen() {
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
    localStorage.setItem("isFullScreen", "no");
  }
  handleAddBookmark() {
    let bookKey = this.props.currentBook.key;
    let epub = this.props.currentEpub;
    let cfi =
      RecordLocation.getCfi(this.props.currentBook.key) === null
        ? 0
        : RecordLocation.getCfi(this.props.currentBook.key).cfi;
    let firstVisibleNode = epub.renderer.findFirstVisible();
    let label = firstVisibleNode ? firstVisibleNode.textContent : "";
    label = label && label.trim();
    label = label || cfi;
    let percentage =
      RecordLocation.getCfi(this.props.currentBook.key) === null
        ? 0
        : RecordLocation.getCfi(this.props.currentBook.key).percentage;
    let index = this.props.chapters.findIndex((item) => {
      return item.spinePos > this.props.currentEpub.spinePos;
    });
    let chapter = "未知章节";
    if (this.props.chapters[index] !== undefined) {
      chapter = this.props.chapters[index].label.trim(" ");
    }
    let bookmark = new Bookmark(bookKey, cfi, label, percentage, chapter);
    let bookmarkArr = this.props.bookmarks ? this.props.bookmarks : [];
    bookmarkArr.push(bookmark);
    this.props.handleBookmarks(bookmarkArr);
    localforage.setItem("bookmarks", bookmarkArr);
    this.setState({ isBookmark: true });
    this.props.handleMessage("添加成功");
    this.props.handleMessageBox(true);
  }

  // 点击退出按钮的处理程序
  handleExit() {
    this.props.handleReadingState(false);
    let cfi = this.props.currentEpub.getCurrentLocationCfi();
    let locations = this.props.currentEpub.locations;
    let percentage = locations.percentageFromCfi(cfi);
    RecordLocation.recordCfi(this.props.currentBook.key, cfi, percentage);
  }

  render() {
    return (
      <div className="book-operation-panel">
        <div
          className="exit-reading-button"
          onClick={() => {
            this.handleExit();
          }}
        >
          <span className="icon-exit exit-reading-icon"></span>
          <span className="exit-reading-text">退出阅读</span>
        </div>
        <div
          className="add-bookmark-button"
          onClick={() => {
            this.handleAddBookmark();
          }}
        >
          <span className="icon-add add-bookmark-icon"></span>
          {true ? (
            <span className="add-bookmark-text">添加书签</span>
          ) : (
            <span className="add-bookmark-text">取消书签</span>
          )}
        </div>
        <div
          className="enter-fullscreen-button"
          onClick={() => {
            this.handleScreen();
          }}
        >
          <span className="icon-fullscreen enter-fullscreen-icon"></span>
          {!this.state.isFullScreen ? (
            <span className="enter-fullscreen-text">进入全屏</span>
          ) : (
            <span className="enter-fullscreen-text">退出全屏</span>
          )}
        </div>
      </div>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    chapters: state.reader.chapters,
  };
};
const actionCreator = {
  handleBookmarks,
  handleReadingState,
  handleFetchBookmarks,
  handleMessageBox,
  handleMessage,
};
export default connect(mapStateToProps, actionCreator)(OperationPanel);
