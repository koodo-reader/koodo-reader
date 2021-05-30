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
import iconv from "iconv-lite";
import chardet from "chardet";
import rtfToHTML from "@iarna/rtf-to-html";
import { xmlBookTagFilter, xmlBookToObj } from "../../utils/xmlUtil";
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
        } else if (book.format === "FB2") {
          this.handleFb2(result as ArrayBuffer);
        } else if (book.format === "RTF") {
          this.handleRtf(result as ArrayBuffer);
        } else if (book.format === "DOCX") {
          this.handleDocx(result as ArrayBuffer);
        } else if (book.format === "FB2") {
          this.handleFb2(result as ArrayBuffer);
        }
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

  handleMobi = async (result: ArrayBuffer) => {
    let mobiFile = new MobiParser(result);
    let content: any = await mobiFile.render();
    let viewer: HTMLElement | null = document.querySelector(".ebook-viewer");
    if (!viewer?.innerHTML) return;
    viewer.innerHTML = content.outerHTML;
  };
  handleTxt = (result: ArrayBuffer) => {
    let viewer: HTMLElement | null = document.querySelector(".ebook-viewer");
    let text = iconv.decode(
      Buffer.from(result),
      chardet.detect(Buffer.from(result)) as string
    );
    if (!viewer?.innerText) return;
    viewer.innerText = text;
  };
  handleMD = (result: ArrayBuffer) => {
    var blob = new Blob([result], { type: "text/plain" });
    var reader = new FileReader();
    reader.onload = function (evt) {
      let viewer: HTMLElement | null = document.querySelector(".ebook-viewer");
      if (!viewer?.innerHTML) return;
      viewer.innerHTML = marked(evt.target?.result as any);
    };
    reader.readAsText(blob, "UTF-8");
  };
  handleRtf = (result: ArrayBuffer) => {
    let text = iconv.decode(
      Buffer.from(result),
      chardet.detect(Buffer.from(result)) as string
    );
    rtfToHTML.fromString(text, (err: any, html: any) => {
      let viewer: HTMLElement | null = document.querySelector(".ebook-viewer");
      if (!viewer?.innerHTML) return;
      viewer.innerHTML = html;
    });
  };
  handleDocx = (result: ArrayBuffer) => {
    window.mammoth.convertToHtml({ arrayBuffer: result }).then((res: any) => {
      let viewer: HTMLElement | null = document.querySelector(".ebook-viewer");
      if (!viewer?.innerHTML) return;
      viewer.innerHTML = res.value;
    });
  };
  handleFb2 = (result: ArrayBuffer) => {
    let fb2Str = iconv.decode(
      Buffer.from(result),
      chardet.detect(Buffer.from(result)) as string
    );
    let bookObj = xmlBookToObj(Buffer.from(result));
    bookObj += xmlBookTagFilter(fb2Str);
    console.log(bookObj, "bookboj");
    let viewer: HTMLElement | null = document.querySelector(".ebook-viewer");
    if (!viewer?.innerHTML) return;
    viewer.innerHTML = bookObj;
  };
  render() {
    return <div className="ebook-viewer">Loading</div>;
  }
}
export default withRouter(Viewer as any);
