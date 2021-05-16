//卡片模式下的图书显示
import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/bookUtil";
import MobiParser from "../../utils/mobiParser";
import marked from "marked";
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
        if (book.format === "MOBI" || book.format === "AZW3") {
          this.handleMobi(result as ArrayBuffer);
        } else if (book.format === "TXT") {
          this.handleTxt(result as ArrayBuffer);
        } else if (book.format === "MD") {
          this.handleMD(result as ArrayBuffer);
        }
        this.props.handleReadingState(true);
        RecentBooks.setRecent(key);
      });
    });
    document.location.href.indexOf("md") > -1 &&
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
  handleMobi = async (result: ArrayBuffer) => {
    let mobiFile = new MobiParser(result);
    let content: any = await mobiFile.render();
    let viewer: HTMLElement | null = document.querySelector(".ebook-viewer");
    if (!viewer?.innerHTML) return;
    viewer.innerHTML = content.outerHTML;
  };
  handleTxt = (result: ArrayBuffer) => {
    var blob = new Blob([result], { type: "text/plain" });
    var reader = new FileReader();
    reader.onload = function (evt) {
      let viewer: HTMLElement | null = document.querySelector(".ebook-viewer");
      console.log(evt.target?.result, viewer, document);
      if (!viewer?.innerText) return;
      viewer.innerText = evt.target?.result as any;
    };
    reader.readAsText(blob, "UTF-8");
  };
  handleMD = (result: ArrayBuffer) => {
    var blob = new Blob([result], { type: "text/plain" });
    var reader = new FileReader();
    reader.onload = function (evt) {
      let viewer: HTMLElement | null = document.querySelector(".ebook-viewer");
      console.log(evt.target?.result, viewer, document);
      if (!viewer?.innerHTML) return;
      viewer.innerHTML = marked(evt.target?.result as any);
    };
    reader.readAsText(blob, "UTF-8");
  };
  render() {
    return <div className="ebook-viewer">Loading</div>;
  }
}
export default withRouter(Viewer as any);
