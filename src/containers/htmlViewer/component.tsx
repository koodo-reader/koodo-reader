import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import BookUtil from "../../utils/fileUtils/bookUtil";
import iconv from "iconv-lite";
import chardet from "chardet";
import rtfToHTML from "@iarna/rtf-to-html";
import { xmlBookTagFilter, xmlBookToObj } from "../../utils/fileUtils/xmlUtil";
import StorageUtil from "../../utils/storageUtil";
import RecordLocation from "../../utils/readUtils/recordLocation";
import { mimetype } from "../../constants/mimetype";
import BackgroundWidget from "../../components/backgroundWidget";
import toast from "react-hot-toast";

declare var window: any;

const { MobiRender, Azw3Render, TxtRender, StrRender } = window.Kookit;

class Viewer extends React.Component<ViewerProps, ViewerState> {
  epub: any;
  lock: boolean;
  constructor(props: ViewerProps) {
    super(props);
    this.state = {
      key: "",
      isFirst: true,
      scale: StorageUtil.getReaderConfig("scale") || 1,
      chapterTitle:
        RecordLocation.getScrollHeight(this.props.currentBook.key)
          .chapterTitle || "",
    };
    this.lock = false;
  }

  componentDidMount() {
    let { key, path, format, name } = this.props.currentBook;
    BookUtil.fetchBook(key, true, path).then((result) => {
      if (!result) {
        toast.error(this.props.t("Book not exsits"));
        return;
      }

      if (format === "MOBI") {
        this.handleMobi(result as ArrayBuffer);
      } else if (format === "AZW3") {
        this.handleAzw3(result as ArrayBuffer);
      } else if (format === "TXT") {
        this.handleTxt(result as ArrayBuffer);
      } else if (format === "MD") {
        this.handleMD(result as ArrayBuffer);
      } else if (format === "FB2") {
        this.handleFb2(result as ArrayBuffer);
      } else if (format === "RTF") {
        this.handleRtf(result as ArrayBuffer);
      } else if (format === "DOCX") {
        this.handleDocx(result as ArrayBuffer);
      } else if (
        format === "HTML" ||
        format === "XHTML" ||
        format === "HTM" ||
        format === "XML"
      ) {
        this.handleHtml(result as ArrayBuffer, format);
      }
      this.props.handleReadingState(true);

      RecentBooks.setRecent(this.props.currentBook.key);
      document.title = name + " - Koodo Reader";
    });

    // this.props.handleRenderFunc(this.handleRenderHtml);
  }
  handleRest = (rendition: any) => {
    let bookLocation = RecordLocation.getScrollHeight(
      this.props.currentBook.key
    );
    rendition.goToPosition(
      bookLocation.text,
      bookLocation.chapterTitle,
      bookLocation.count
    );
    window.frames[0].document.addEventListener("click", (event) => {
      this.props.handleLeaveReader("left");
      this.props.handleLeaveReader("right");
      this.props.handleLeaveReader("top");
      this.props.handleLeaveReader("bottom");
    });
    let iframe = document.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) return;
    let isFirefox = navigator.userAgent.indexOf("Firefox") > -1;
    if (isFirefox) {
      doc.addEventListener(
        "DOMMouseScroll",
        (event) => {
          RecordLocation.recordScrollHeight(
            this.props.htmlBook.key,
            StorageUtil.getKookitConfig("text"),
            StorageUtil.getKookitConfig("chapterTitle"),
            StorageUtil.getKookitConfig("count")
          );
        },
        false
      );
    } else {
      doc.addEventListener(
        "mousewheel",
        (event) => {
          RecordLocation.recordScrollHeight(
            this.props.htmlBook.key,
            StorageUtil.getKookitConfig("text"),
            StorageUtil.getKookitConfig("chapterTitle"),
            StorageUtil.getKookitConfig("count")
          );
        },
        false
      );
    }
    this.props.handleHtmlBook({
      key: this.props.currentBook.key,
      chapters: rendition.getChapter(),
      subitems: [],
      rendition: rendition,
    });
  };
  handleMobi = async (result: ArrayBuffer) => {
    let rendition = new MobiRender(result, "single");
    await rendition.renderTo(
      document.getElementsByClassName("ebook-viewer")[0]
    );
    this.handleRest(rendition);
  };
  handleAzw3 = async (result: ArrayBuffer) => {
    let rendition = new Azw3Render(result, "continuous");
    await rendition.renderTo(
      document.getElementsByClassName("ebook-viewer")[0]
    );
    this.handleRest(rendition);
  };
  handleCharset = (result: ArrayBuffer) => {
    return new Promise<string>(async (resolve, reject) => {
      let { books } = this.props;
      let charset = "";
      books.forEach((item) => {
        if (item.key === this.props.currentBook.key) {
          charset = chardet.detect(Buffer.from(result)) || "";
          item.charset = charset;
          this.props.handleReadingBook(item);
        }
      });

      await localforage.setItem("books", books);
      // this.props.handleFetchBooks();
      resolve(charset);
    });
  };
  handleTxt = async (result: ArrayBuffer) => {
    let charset = "";
    if (!this.props.currentBook.charset) {
      charset = await this.handleCharset(result);
    }
    let rendition = new TxtRender(
      result,
      "single",
      this.props.currentBook.charset || charset || "utf8"
    );
    await rendition.renderTo(
      document.getElementsByClassName("ebook-viewer")[0]
    );
    this.handleRest(rendition);
  };
  handleMD = (result: ArrayBuffer) => {
    var blob = new Blob([result], { type: "text/plain" });
    var reader = new FileReader();
    reader.onload = async (evt) => {
      let docStr = window.marked(evt.target?.result as any);
      let rendition = new StrRender(docStr, "continuous");
      await rendition.renderTo(
        document.getElementsByClassName("ebook-viewer")[0]
      );
      this.handleRest(rendition);
    };
    reader.readAsText(blob, "UTF-8");
  };
  handleRtf = async (result: ArrayBuffer) => {
    let charset = "";
    if (!this.props.currentBook.charset) {
      charset = await this.handleCharset(result);
    }
    let text = iconv.decode(
      Buffer.from(result),
      this.props.currentBook.charset || charset || "utf8"
    );

    rtfToHTML.fromString(text, async (err: any, html: any) => {
      let rendition = new StrRender(html, "continuous");
      await rendition.renderTo(
        document.getElementsByClassName("ebook-viewer")[0]
      );
      this.handleRest(rendition);
    });
  };
  handleDocx = (result: ArrayBuffer) => {
    window.mammoth
      .convertToHtml({ arrayBuffer: result })
      .then(async (res: any) => {
        let rendition = new StrRender(res.value, "continuous");
        await rendition.renderTo(
          document.getElementsByClassName("ebook-viewer")[0]
        );
        this.handleRest(rendition);
      });
  };
  handleFb2 = async (result: ArrayBuffer) => {
    let charset = "";
    if (!this.props.currentBook.charset) {
      charset = await this.handleCharset(result);
    }
    let fb2Str = iconv.decode(
      Buffer.from(result),
      this.props.currentBook.charset || charset || "utf8"
    );
    let bookObj = xmlBookToObj(Buffer.from(result));
    bookObj += xmlBookTagFilter(fb2Str);
    let rendition = new StrRender(bookObj, "continuous");
    await rendition.renderTo(
      document.getElementsByClassName("ebook-viewer")[0]
    );
    this.handleRest(rendition);
  };
  handleHtml = (result: ArrayBuffer, format: string) => {
    var blob = new Blob([result], {
      type: mimetype[format.toLocaleLowerCase()],
    });
    var reader = new FileReader();
    reader.onload = async (evt) => {
      const html = evt.target?.result as any;
      let rendition = new StrRender(html, "continuous");
      await rendition.renderTo(
        document.getElementsByClassName("ebook-viewer")[0]
      );
      this.handleRest(rendition);
    };
    reader.readAsText(blob, "UTF-8");
  };
  render() {
    console.log(parseFloat(this.state.scale));
    return (
      <>
        <div
          className="ebook-viewer"
          style={{
            position: "absolute",
            left: `calc(50vw - ${270 * parseFloat(this.state.scale)}px + 9px)`,
            right: `calc(50vw - ${270 * parseFloat(this.state.scale)}px + 7px)`,
            top: "20px",
            bottom: "20px",
            zIndex: 5,
          }}
        ></div>
        {StorageUtil.getReaderConfig("isHideBackground") === "yes" ? null : this
            .props.currentBook.key ? (
          <BackgroundWidget />
        ) : null}
      </>
    );
  }
}
export default withRouter(Viewer as any);
