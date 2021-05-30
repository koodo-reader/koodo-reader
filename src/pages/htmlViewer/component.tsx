//卡片模式下的图书显示
import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/bookUtil";
import "./viewer.css";
import OtherUtil from "../../utils/otherUtil";
import { mimetype } from "../../constants/mimetype";
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

        this.handleHtml(result as ArrayBuffer, book.format);

        this.props.handleReadingState(true);
        RecentBooks.setRecent(key);
      });
    });

    // document
    //   .querySelectorAll('style,link[rel="stylesheet"]')
    //   .forEach((item) => item.remove());

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
  handleHtml = (result: ArrayBuffer, format: string) => {
    var blob = new Blob([result], {
      type: mimetype[format.toLocaleLowerCase()],
    });
    var reader = new FileReader();
    reader.onload = function (evt) {
      let iframe: any = document.querySelector(".html-viewer");
      if (!iframe) return;
      const html = evt.target?.result as any;
      iframe.sandbox = "";
      iframe.srcdoc = html;
    };
    reader.readAsText(blob, "UTF-8");
  };
  render() {
    return (
      <iframe
        className="html-viewer"
        title="html-viewer"
        width="100%"
        height="100%"
      />
    );
  }
}
export default withRouter(Viewer as any);
