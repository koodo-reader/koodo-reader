//卡片模式下的图书显示
import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/bookUtil";
// import { Unzipper } from "@codedread/bitjs";
import "./viewer.css";
import OtherUtil from "../../utils/otherUtil";

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
      BookUtil.fetchBook(key, true).then((result) => {
        this.props.handleReadingBook(book);
        if (book.format === "CBR") {
          this.handleCbr(result as ArrayBuffer);
        } else if (book.format === "CBZ") {
          this.handleCbz(result as ArrayBuffer);
        } else if (book.format === "CBT") {
          this.handleCbt(result as ArrayBuffer);
        }
        this.props.handleReadingState(true);
        RecentBooks.setRecent(key);
      });
    });
    document
      .querySelectorAll('style,link[rel="stylesheet"]')
      .forEach((item) => item.remove());
    window.onbeforeunload = () => {
      this.handleExit();
    };
  }
  // 点击退出按钮的处理程序
  handleExit() {
    this.props.handleReadingState(false);

    OtherUtil.setReaderConfig("windowWidth", document.body.clientWidth + "");
    OtherUtil.setReaderConfig("windowHeight", document.body.clientHeight + "");
    OtherUtil.setReaderConfig("windowX", window.screenX + "");
    OtherUtil.setReaderConfig("windowY", window.screenY + "");
  }
  handleCbz = (result: ArrayBuffer) => {
    // const unzipper = new Unzipper(result);
    // unzipper.addEventListener("progress", (e) => {
    //   console.log(e.currentFilename, e.totalCompressedBytesRead);
    // });
    // unzipper.addEventListener("extract", (e) => {
    //   console.log(e.unarchivedFile.filename, e.unarchivedFile.fileData);
    // });
    // unzipper.addEventListener("finish", () => {
    //   console.log("finish");
    // });
    // unzipper.start();
    // let viewer: HTMLElement | null = document.querySelector(".ebook-viewer");
    // if (!viewer?.innerHTML) return;
    // viewer.innerHTML = "";
  };
  handleCbr = (result: ArrayBuffer) => {};
  handleCbt = (result: ArrayBuffer) => {};
  render() {
    return <div className="ebook-viewer">Loading</div>;
  }
}
export default withRouter(Viewer as any);
