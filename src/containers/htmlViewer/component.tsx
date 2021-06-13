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
import iconv from "iconv-lite";
import chardet from "chardet";
import rtfToHTML from "@iarna/rtf-to-html";
import { xmlBookTagFilter, xmlBookToObj } from "../../utils/xmlUtil";
import HtmlParser from "../../utils/htmlParser";
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
    // document.documentElement.style.height = "auto";
    // document.documentElement.style.overflow = "auto";

    window.frames[0].document.addEventListener("wheel", (event) => {
      RecordLocation.recordScrollHeight(
        key,
        document.body.clientWidth,
        document.body.clientHeight,
        window.frames[0].document.scrollingElement!.scrollTop
      );
    });
    window.frames[0].document.addEventListener("click", (event) => {
      this.props.handleLeaveReader("left");
      this.props.handleLeaveReader("right");
      this.props.handleLeaveReader("top");
      this.props.handleLeaveReader("bottom");
    });

    window.onbeforeunload = () => {
      this.handleExit();
    };
  }
  handleExit() {
    this.props.handleReadingState(false);

    OtherUtil.setReaderConfig("windowWidth", document.body.clientWidth + "");
    OtherUtil.setReaderConfig("windowHeight", document.body.clientHeight + "");
    OtherUtil.setReaderConfig("windowX", window.screenX + "");
    OtherUtil.setReaderConfig("windowY", window.screenY + "");
  }
  handleRest = () => {
    styleUtil.addHtmlCss();
    window.frames[0].document.scrollingElement!.scrollTo(
      0,
      RecordLocation.getScrollHeight(this.state.key).scroll
    );
  };
  handleMobi = async (result: ArrayBuffer) => {
    let mobiFile = new MobiParser(result);
    let content: any = await mobiFile.render();
    window.frames[0].document.body.innerHTML = content.outerHTML;
    this.handleRest();
  };
  handleTxt = (result: ArrayBuffer) => {
    let text = iconv.decode(
      Buffer.from(result),
      chardet.detect(Buffer.from(result)) as string
    );

    window.frames[0].document.body.innerText = text;
    this.handleRest();
  };
  handleMD = (result: ArrayBuffer) => {
    var blob = new Blob([result], { type: "text/plain" });
    var reader = new FileReader();
    reader.onload = (evt) => {
      window.frames[0].document.body.innerHTML = marked(
        evt.target?.result as any
      );
      this.handleRest();
    };
    reader.readAsText(blob, "UTF-8");
  };
  handleRtf = (result: ArrayBuffer) => {
    let text = iconv.decode(
      Buffer.from(result),
      chardet.detect(Buffer.from(result)) as string
    );
    rtfToHTML.fromString(text, (err: any, html: any) => {
      window.frames[0].document.body.innerHTML = html;
      this.handleRest();
    });
  };
  handleDocx = (result: ArrayBuffer) => {
    window.mammoth.convertToHtml({ arrayBuffer: result }).then((res: any) => {
      let viewer: any = document.querySelector(".ebook-viewer");
      if (!viewer?.innerHTML) return;

      let htmlParser = new HtmlParser(
        new DOMParser().parseFromString(res.value, "text/html")
      );
      this.props.handleHtmlBook({
        doc: htmlParser.getAnchoredDoc(),
        chapters: htmlParser.getContentList(),
        subitems: [],
      });
      window.frames[0].document.body.innerHTML = htmlParser.getAnchoredDoc().documentElement.outerHTML;

      this.handleRest();
    });
  };
  handleFb2 = (result: ArrayBuffer) => {
    let fb2Str = iconv.decode(
      Buffer.from(result),
      chardet.detect(Buffer.from(result)) as string
    );
    let bookObj = xmlBookToObj(Buffer.from(result));
    bookObj += xmlBookTagFilter(fb2Str);

    window.frames[0].document.body.innerHTML = bookObj;
    this.handleRest();
  };
  handleHtml = (result: ArrayBuffer, format: string) => {
    var blob = new Blob([result], {
      type: mimetype[format.toLocaleLowerCase()],
    });
    var reader = new FileReader();
    reader.onload = (evt) => {
      const html = evt.target?.result as any;
      window.frames[0].document.body.innerHTML = html;
      this.handleRest();
    };
    reader.readAsText(blob, "UTF-8");
  };
  render() {
    return (
      <iframe
        className="ebook-viewer"
        title="html-viewer"
        width="100%"
        height="100%"
      >
        Loading
      </iframe>
    );
  }
}
export default withRouter(Viewer as any);
