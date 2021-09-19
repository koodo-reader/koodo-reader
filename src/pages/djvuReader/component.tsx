import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/fileUtils/bookUtil";
import "./viewer.css";
import OtherUtil from "../../utils/otherUtil";
import { isElectron } from "react-device-detect";

declare var window: any;

class Viewer extends React.Component<ViewerProps, ViewerState> {
  epub: any;
  constructor(props: ViewerProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    let url = document.location.href.split("/");
    let key = url[url.length - 1].split("?")[0];

    localforage.getItem("books").then((result: any) => {
      let book = result[_.findIndex(result, { key })];
      BookUtil.fetchBook(key, true, book.path).then((result) => {
        this.props.handleReadingBook(book);
        this.handleDjvu(result as ArrayBuffer);
        this.props.handleReadingState(true);
        RecentBooks.setRecent(key);
        document.title = book.name + " - Koodo Reader";
      });
    });
    document
      .querySelector(".ebook-viewer")
      ?.setAttribute("style", "height:100%");
    window.onbeforeunload = () => {
      this.handleExit();
    };
  }
  // 点击退出按钮的处理程序
  handleExit() {
    this.props.handleReadingState(false);

    if (isElectron) {
      const { remote } = window.require("electron");
      let bounds = remote.getCurrentWindow().getBounds();
      OtherUtil.setReaderConfig("windowWidth", bounds.width);
      OtherUtil.setReaderConfig("windowHeight", bounds.height);
      OtherUtil.setReaderConfig("windowX", bounds.x);
      OtherUtil.setReaderConfig("windowY", bounds.y);
    }
  }

  handleDjvu = async (result: ArrayBuffer) => {
    setTimeout(() => {
      var ViewerInstance = new window.DjVu.Viewer();
      ViewerInstance.render(document.querySelector(".ebook-viewer"));
      ViewerInstance.loadDocument(result);
    }, 100);
  };

  render() {
    return <div className="ebook-viewer">Loading</div>;
  }
}
export default withRouter(Viewer as any);
