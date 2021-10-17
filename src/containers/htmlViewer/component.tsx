import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
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
import { isElectron } from "react-device-detect";
import Lottie from "react-lottie";
import animationSiri from "../../assets/lotties/siri.json";
import _ from "underscore";
import BackgroundWidget from "../../components/backgroundWidget";
import toast from "react-hot-toast";

declare var window: any;
const siriOptions = {
  loop: true,
  autoplay: true,
  animationData: animationSiri,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};
class Viewer extends React.Component<ViewerProps, ViewerState> {
  epub: any;
  constructor(props: ViewerProps) {
    super(props);
    this.state = {
      key: "",
      isLoading: true,
      scale: OtherUtil.getReaderConfig("scale") || 1,
    };
  }

  componentDidMount() {
    let url = document.location.href.split("/");
    let key = url[url.length - 1].split("?")[0];
    this.setState({ key });
    localforage.getItem("books").then((result: any) => {
      let book = result[_.findIndex(result, { key })];
      BookUtil.fetchBook(key, true, book.path).then((result) => {
        if (!result) {
          toast.error(this.props.t("Book not exsits"));
          return;
        }
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
        this.props.handleReadingBook(book);

        RecentBooks.setRecent(key);
        document.title = book.name + " - Koodo Reader";
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
      ) * 2;
    setTimeout(() => {
      let iFrame: any = document.getElementsByTagName("iframe")[0];
      let body = iFrame.contentWindow.document.body;
      let lastchild = body.lastElementChild;
      let lastEle = body.lastChild;
      let itemAs = body.querySelectorAll("a");
      let itemPs = body.querySelectorAll("p");
      let lastItemA = itemAs[itemAs.length - 1];
      let lastItemP = itemPs[itemPs.length - 1];
      let lastItem;
      if (_.isElement(lastItemA) && _.isElement(lastItemP)) {
        if (
          lastItemA.clientHeight + (lastItemA as any).offsetTop >
          lastItemP.clientHeight + (lastItemP as any).offsetTop
        ) {
          lastItem = lastItemA;
        } else {
          lastItem = lastItemP;
        }
      }

      let nodeHeight = 0;

      if (!lastchild && !lastItem && !lastEle) return;
      if (lastEle.nodeType === 3 && !lastchild && !lastItem) return;

      if (lastEle.nodeType === 3) {
        if (document.createRange) {
          let range = document.createRange();
          range.selectNodeContents(lastEle);
          if (range.getBoundingClientRect) {
            let rect = range.getBoundingClientRect();
            if (rect) {
              nodeHeight = rect.bottom - rect.top;
            }
          }
        }
      }

      iFrame.height =
        Math.max(
          _.isElement(lastchild)
            ? lastchild.clientHeight + (lastchild as any).offsetTop
            : 0,
          _.isElement(lastEle)
            ? lastEle.clientHeight + (lastEle as any).offsetTop
            : 0,
          _.isElement(lastItem)
            ? lastItem.clientHeight + (lastItem as any).offsetTop
            : 0
        ) +
        400 +
        (lastEle.nodeType === 3 ? nodeHeight : 0);
    }, 500);
  };
  handleRecord() {
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
    this.setState({ isLoading: false });

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
      let links = doc.getElementsByTagName("a");
      for (let item of links) {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          this.handleJump(item.href);
        });
      }
      for (let item of imgs) {
        item.setAttribute("style", "max-width: 100%");
      }

      this.bindEvent(doc);
    }, 1);
  };
  handleJump = (url: string) => {
    isElectron
      ? window.require("electron").shell.openExternal(url)
      : window.open(url);
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
      <>
        {this.state.isLoading && (
          <div className="spinner">
            <Lottie options={siriOptions} height={100} width={300} />
          </div>
        )}

        <div
          className="ebook-viewer"
          style={{
            position: "absolute",
            left: `calc(50vw - ${270 * parseFloat(this.state.scale)}px + 9px)`,
            right: `calc(50vw - ${270 * parseFloat(this.state.scale)}px + 7px)`,
            top: "20px",
            bottom: "20px",
            overflowY: "scroll",
            zIndex: 5,
          }}
        >
          <iframe title="html-viewer" width="100%">
            Loading
          </iframe>
        </div>
        {OtherUtil.getReaderConfig("isHideBackground") === "yes" ? null : this
            .props.currentBook.key ? (
          <BackgroundWidget />
        ) : null}
      </>
    );
  }
}
export default withRouter(Viewer as any);
