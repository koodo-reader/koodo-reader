//卡片模式下的图书显示
import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/fileUtils/bookUtil";
import MobiParser from "../../utils/fileUtils/mobiParser";
import marked from "marked";
import iconv from "iconv-lite";
import chardet from "chardet";
import rtfToHTML from "@iarna/rtf-to-html";
import {
  xmlBookTagFilter,
  xmlBookToObj,
  txtToHtml,
} from "../../utils/fileUtils/xmlUtil";
import HtmlParser from "../../utils/fileUtils/htmlParser";
import OtherUtil from "../../utils/otherUtil";
import RecordLocation from "../../utils/readUtils/recordLocation";
import { mimetype } from "../../constants/mimetype";
import styleUtil from "../../utils/readUtils/styleUtil";

declare var window: any;

class Viewer extends React.Component<ViewerProps, ViewerState> {
  epub: any;
  constructor(props: ViewerProps) {
    super(props);
    this.state = { key: "" };
  }

  componentDidMount() {
    let url = document.location.href.split("/");
    let key = url[url.length - 1].split("?")[0];
    this.setState({ key });
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
        } else if (
          book.format === "HTML" ||
          book.format === "XHTML" ||
          book.format === "HTM" ||
          book.format === "XML"
        ) {
          this.handleHtml(result as ArrayBuffer, book.format);
        }
        this.props.handleReadingState(true);
        RecentBooks.setRecent(key);
      });
    });
    this.props.handleRenderFunc(this.handleRenderHtml);

    window.frames[0].document.addEventListener("click", (event) => {
      this.props.handleLeaveReader("left");
      this.props.handleLeaveReader("right");
      this.props.handleLeaveReader("top");
      this.props.handleLeaveReader("bottom");
    });
  }
  handleIframeHeight = () => {
    let iFrame: any = document.getElementsByTagName("iframe")[0];
    var body = iFrame.contentWindow.document.body,
      html = iFrame.contentWindow.document.documentElement;
    iFrame.height =
      Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      ) + 1000;
  };
  handleRecord() {
    OtherUtil.setReaderConfig("windowWidth", document.body.clientWidth + "");
    OtherUtil.setReaderConfig("windowHeight", document.body.clientHeight + "");
    OtherUtil.setReaderConfig("windowX", window.screenX + "");
    OtherUtil.setReaderConfig("windowY", window.screenY + "");
    RecordLocation.recordScrollHeight(
      this.state.key,
      document.body.clientWidth,
      document.body.clientHeight,
      document.getElementsByClassName("ebook-viewer")[0].scrollTop,
      document.getElementsByClassName("ebook-viewer")[0].scrollHeight
    );
  }
  handleRest = (docStr: string) => {
    let htmlParser = new HtmlParser(
      new DOMParser().parseFromString(docStr, "text/html")
    );
    this.props.handleHtmlBook({
      doc: htmlParser.getAnchoredDoc(),
      chapters: htmlParser.getContentList(),
      subitems: [],
    });
    this.handleRenderHtml();
  };
  handleRenderHtml = () => {
    window.frames[0].document.body.innerHTML = "";
    window.frames[0].document.body.innerHTML = (this.props.htmlBook
      .doc as any).documentElement.outerHTML;
    styleUtil.addHtmlCss();
    this.handleIframeHeight();

    setTimeout(() => {
      document
        .getElementsByClassName("ebook-viewer")[0]
        .scrollTo(0, RecordLocation.getScrollHeight(this.state.key).scroll);
      let iframe = document.getElementsByTagName("iframe")[0];
      if (!iframe) return;
      let doc = iframe.contentDocument;
      if (!doc) {
        return;
      }
      let imgs = doc.getElementsByTagName("img");
      for (let item of imgs) {
        item.setAttribute("style", "max-width: 100%");
      }
      this.bindEvent(doc);
    }, 1);
  };
  bindEvent = (doc: any) => {
    let isFirefox = navigator.userAgent.indexOf("Firefox") > -1;
    // 鼠标滚轮翻页
    if (isFirefox) {
      doc.addEventListener(
        "DOMMouseScroll",
        () => {
          this.handleRecord();
        },
        false
      );
    } else {
      doc.addEventListener(
        "mousewheel",
        () => {
          this.handleRecord();
        },
        false
      );
    }
  };
  handleMobi = async (result: ArrayBuffer) => {
    let mobiFile = new MobiParser(result);
    let content: any = await mobiFile.render();
    this.handleRest(content.outerHTML);
  };
  handleTxt = (result: ArrayBuffer) => {
    let text = iconv.decode(
      Buffer.from(result),
      chardet.detect(Buffer.from(result)) as string
    );
    this.handleRest(txtToHtml(text));
  };
  handleMD = (result: ArrayBuffer) => {
    var blob = new Blob([result], { type: "text/plain" });
    var reader = new FileReader();
    reader.onload = (evt) => {
      this.handleRest(marked(evt.target?.result as any));
    };
    reader.readAsText(blob, "UTF-8");
  };
  handleRtf = (result: ArrayBuffer) => {
    let text = iconv.decode(
      Buffer.from(result),
      chardet.detect(Buffer.from(result)) as string
    );
    rtfToHTML.fromString(text, (err: any, html: any) => {
      this.handleRest(html);
    });
  };
  handleDocx = (result: ArrayBuffer) => {
    window.mammoth.convertToHtml({ arrayBuffer: result }).then((res: any) => {
      this.handleRest(res.value);
    });
  };
  handleFb2 = (result: ArrayBuffer) => {
    let fb2Str = iconv.decode(
      Buffer.from(result),
      chardet.detect(Buffer.from(result)) as string
    );
    let bookObj = xmlBookToObj(Buffer.from(result));
    bookObj += xmlBookTagFilter(fb2Str);
    this.handleRest(bookObj);
  };
  handleHtml = (result: ArrayBuffer, format: string) => {
    var blob = new Blob([result], {
      type: mimetype[format.toLocaleLowerCase()],
    });
    var reader = new FileReader();
    reader.onload = (evt) => {
      const html = evt.target?.result as any;
      this.handleRest(html);
    };
    reader.readAsText(blob, "UTF-8");
  };
  render() {
    return (
      <div
        className="ebook-viewer"
        style={{
          width: `${
            (100 * parseFloat(OtherUtil.getReaderConfig("scale") || "1")) / 2
          }%`,
          height: "100%",
          marginLeft: `${
            (100 *
              (2 - parseFloat(OtherUtil.getReaderConfig("scale") || "1"))) /
            4
          }%`,
          overflowY: "scroll",
        }}
      >
        <iframe title="html-viewer" width="100%">
          Loading
        </iframe>
      </div>
    );
  }
}
export default withRouter(Viewer as any);
