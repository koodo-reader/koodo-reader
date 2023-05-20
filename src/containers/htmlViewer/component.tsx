import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import { withRouter } from "react-router-dom";
import BookUtil from "../../utils/fileUtils/bookUtil";
import PopupMenu from "../../components/popups/popupMenu";
import StorageUtil from "../../utils/serviceUtils/storageUtil";
import RecordLocation from "../../utils/readUtils/recordLocation";
import { mimetype } from "../../constants/mimetype";
import Background from "../../components/background";
import toast from "react-hot-toast";
import * as jschardet from "jschardet";
import StyleUtil from "../../utils/readUtils/styleUtil";
import "./index.css";
import { HtmlMouseEvent } from "../../utils/serviceUtils/mouseEvent";
import ImageViewer from "../../components/imageViewer";
import { getIframeDoc } from "../../utils/serviceUtils/docUtil";
import { tsTransform } from "../../utils/serviceUtils/langUtil";
import localforage from "localforage";
import { removeExtraQuestionMark } from "../../utils/commonUtil";
import CFI from "epub-cfi-resolver";
import mhtml2html from "mhtml2html";
import rtfToHTML from "@iarna/rtf-to-html";
import { binicReadingProcess } from "../../utils/serviceUtils/bionicUtil";

declare var window: any;
let lock = false; //prevent from clicking too fasts

class Viewer extends React.Component<ViewerProps, ViewerState> {
  lock: boolean;
  constructor(props: ViewerProps) {
    super(props);
    this.state = {
      cfiRange: null,
      contents: null,
      rect: null,
      key: "",
      isFirst: true,
      scale: StorageUtil.getReaderConfig("scale") || 1,
      chapterTitle:
        RecordLocation.getHtmlLocation(this.props.currentBook.key)
          .chapterTitle || "",
      readerMode: StorageUtil.getReaderConfig("readerMode") || "double",
      isDisablePopup: StorageUtil.getReaderConfig("isDisablePopup") === "yes",

      margin: parseInt(StorageUtil.getReaderConfig("margin")) || 30,
      extraMargin: 0,
      chapterDocIndex: parseInt(
        RecordLocation.getHtmlLocation(this.props.currentBook.key)
          .chapterDocIndex || 0
      ),
      chapter: "",
      pageWidth: 0,
      pageHeight: 0,
      rendition: null,
    };
    this.lock = false;
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchBookmarks();
    this.props.handleFetchNotes();
    this.props.handleFetchBooks();
  }
  componentDidMount() {
    this.handleRenderBook();

    this.props.handleRenderBookFunc(this.handleRenderBook);

    window.addEventListener("resize", () => {
      if (lock) return;
      let reader = document.querySelector("#page-area");
      //解决文字遮挡问题
      if (
        reader &&
        reader.getAttribute("style") &&
        reader.getAttribute("style")!.indexOf("width") > -1
      ) {
        reader.setAttribute(
          "style",
          reader
            .getAttribute("style")!
            .substring(0, reader.getAttribute("style")!.indexOf("width"))
        );
        StorageUtil.getReaderConfig("readerMode") !== "scroll" &&
          this.handlePageWidth();
      }

      this.handleRenderBook();

      lock = true;
      setTimeout(function () {
        lock = false;
      }, 100);
      return false;
    });
  }
  handlePageWidth = () => {
    let reader = document.querySelector("#page-area");
    //解决文字遮挡问题
    if (reader) {
      reader.setAttribute(
        "style",
        reader.getAttribute("style") +
          "width:" +
          (parseInt(reader.clientWidth + "") % 2
            ? parseInt(reader.clientWidth + "") - 1
            : parseInt(reader.clientWidth + "")) +
          "px; "
      );
    }
  };
  handleRenderBook = () => {
    if (lock) return;
    let { key, path, format, name } = this.props.currentBook;
    this.props.handleHtmlBook(null);
    let doc = getIframeDoc();
    if (doc && this.state.rendition) {
      this.state.rendition.removeContent();
    }

    StorageUtil.getReaderConfig("readerMode") !== "scroll" &&
      this.handlePageWidth();

    window.rangy.init();
    BookUtil.fetchBook(key, true, path).then((result) => {
      if (!result) {
        toast.error(this.props.t("Book not exsit"));
        return;
      }
      if (format === "MOBI" || format === "AZW3" || format === "AZW") {
        this.handleMobi(result as ArrayBuffer);
      } else if (format === "EPUB") {
        this.handleEpub(result as ArrayBuffer);
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
        format === "MHTML" ||
        format === "HTM" ||
        format === "XML"
      ) {
        this.handleHtml(result as ArrayBuffer, format);
      } else if (
        format === "CBR" ||
        format === "CBT" ||
        format === "CBZ" ||
        format === "CB7"
      ) {
        this.handleComic(result as ArrayBuffer, format);
      }
      this.props.handleReadingState(true);

      RecentBooks.setRecent(this.props.currentBook.key);
      document.title = name + " - Koodo Reader";
    });
  };

  handleRest = async (rendition: any) => {
    HtmlMouseEvent(
      rendition,
      this.props.currentBook.key,
      this.state.readerMode
    );
    let chapters = rendition.getChapter();
    let flattenChapters = rendition.flatChapter(chapters);
    this.props.handleHtmlBook({
      key: this.props.currentBook.key,
      chapters,
      flattenChapters,
      rendition: rendition,
    });
    this.setState({ rendition });
    this.setState({
      pageWidth: rendition.getPageSize().width,
      pageHeight: rendition.getPageSize().height,
    });
    StyleUtil.addDefaultCss();
    tsTransform();
    binicReadingProcess();
    rendition.setStyle(
      StyleUtil.getCustomCss(
        true,
        StorageUtil.getReaderConfig("readerMode") === "scroll"
      )
    );
    let bookLocation: {
      text: string;
      count: string;
      chapterTitle: string;
      chapterDocIndex: string;
      chapterHref: string;
      percentage: string;
      cfi: string;
    } = RecordLocation.getHtmlLocation(this.props.currentBook.key);
    //compatile wiht lower version(1.5.1)
    if (bookLocation.cfi) {
      await rendition.goToChapter(
        bookLocation.chapterDocIndex,
        bookLocation.chapterHref,
        bookLocation.chapterTitle
      );
      let cfiObj = new CFI(bookLocation.cfi);
      let pageArea = document.getElementById("page-area");
      if (!pageArea) return;
      let iframe = pageArea.getElementsByTagName("iframe")[0];
      if (!iframe) return;
      let doc: any = iframe.contentDocument;
      if (!doc) {
        return;
      }
      var bookmark = cfiObj.resolveLast(doc, {
        ignoreIDs: true,
      });

      await rendition.goToNode(bookmark.node.parentElement);
    } else {
      await rendition.goToPosition(
        JSON.stringify({
          text: bookLocation.text || "",
          chapterTitle: bookLocation.chapterTitle || "",
          chapterDocIndex: bookLocation.chapterDocIndex || 0,
          chapterHref: bookLocation.chapterHref || "",
          count: bookLocation.count || 0,
          percentage: bookLocation.percentage,
          cfi: bookLocation.cfi,
          isFirst: true,
        })
      );
    }

    rendition.on("rendered", () => {
      this.handleLocation();
      let bookLocation: {
        text: string;
        count: string;
        chapterTitle: string;
        chapterDocIndex: string;
        chapterHref: string;
      } = RecordLocation.getHtmlLocation(this.props.currentBook.key);

      let chapter =
        bookLocation.chapterTitle ||
        (this.props.htmlBook
          ? this.props.htmlBook.flattenChapters[0].title
          : "Unknown Chapter");
      let chapterDocIndex = 0;
      if (bookLocation.chapterDocIndex) {
        chapterDocIndex = parseInt(bookLocation.chapterDocIndex);
      } else {
        chapterDocIndex =
          bookLocation.chapterTitle && this.props.htmlBook
            ? window._.findLastIndex(
                this.props.htmlBook.flattenChapters.map((item) => {
                  item.title = item.title.trim();
                  return item;
                }),
                {
                  title: bookLocation.chapterTitle.trim(),
                }
              )
            : 0;
      }
      this.props.handleCurrentChapter(chapter);
      this.props.handleCurrentChapterIndex(chapterDocIndex);
      this.props.handleFetchPercentage(this.props.currentBook);
      this.setState({
        chapter,
        chapterDocIndex,
      });
      this.handleContentScroll(chapter, bookLocation.chapterHref);
      StyleUtil.addDefaultCss();
      tsTransform();
      binicReadingProcess();
      this.handleBindGesture();
      lock = true;
      setTimeout(function () {
        lock = false;
      }, 1000);
      return false;
    });
  };
  handleContentScroll = (chapter: string, chapterHref: string) => {
    let chapterIndex = window._.findIndex(this.props.htmlBook.flattenChapters, {
      href: chapterHref,
    });
    let contentBody = document.getElementsByClassName("navigation-body")[0];
    if (!contentBody) return;
    let contentList = contentBody.getElementsByTagName("a");
    let targetContent = Array.from(contentList).filter((item, index) => {
      item.setAttribute("style", "");
      return (
        item.textContent === chapter && Math.abs(index - chapterIndex) <= 1
      );
    });
    if (targetContent.length > 0) {
      contentBody.scrollTo(0, targetContent[0].offsetTop);
      targetContent[0].setAttribute("style", "color:red; font-weight: bold");
    }
  };
  handleLocation = () => {
    let position = this.props.htmlBook.rendition.getPosition();
    RecordLocation.recordHtmlLocation(
      this.props.currentBook.key,
      position.text,
      position.chapterTitle,
      position.chapterDocIndex,
      position.chapterHref,
      position.count,
      position.percentage,
      position.cfi
    );
  };
  handleBindGesture = () => {
    let doc = getIframeDoc();
    if (!doc) return;
    doc.addEventListener("click", (event) => {
      this.props.handleLeaveReader("left");
      this.props.handleLeaveReader("right");
      this.props.handleLeaveReader("top");
      this.props.handleLeaveReader("bottom");
    });
    doc.addEventListener("mouseup", () => {
      if (this.state.isDisablePopup) return;
      if (!doc!.getSelection() || doc!.getSelection()!.rangeCount === 0) return;
      var rect = doc!.getSelection()!.getRangeAt(0).getBoundingClientRect();
      this.setState({ rect });
    });
    doc.addEventListener("contextmenu", (event) => {
      if (!this.state.isDisablePopup) return;
      event.preventDefault();
      if (!doc!.getSelection() || doc!.getSelection()!.rangeCount === 0) return;
      var rect = doc!.getSelection()!.getRangeAt(0).getBoundingClientRect();
      this.setState({ rect });
    });
  };
  handleCharset = (bufferStr: string) => {
    return new Promise<string>(async (resolve, reject) => {
      let { books } = this.props;
      let charset = "";
      books.forEach((item) => {
        if (item.key === this.props.currentBook.key) {
          charset = jschardet.detect(bufferStr).encoding || "utf-8";
          item.charset = charset;
          this.props.handleReadingBook(item);
        }
      });
      await localforage.setItem("books", books);
      resolve(charset);
    });
  };
  handleComic = async (result: ArrayBuffer, format: string) => {
    let bookLocation = RecordLocation.getHtmlLocation(
      this.props.currentBook.key
    );
    let rendition = new window.Kookit.ComicRender(
      result,
      this.state.readerMode,
      format
    );
    await rendition.renderTo(
      document.getElementsByClassName("html-viewer-page")[0],
      parseInt(bookLocation.count) || 0
    );
    await this.handleRest(rendition);
  };
  handleMobi = async (result: ArrayBuffer) => {
    let rendition = new window.Kookit.MobiRender(result, this.state.readerMode);
    await rendition.renderTo(
      document.getElementsByClassName("html-viewer-page")[0]
    );
    await this.handleRest(rendition);
  };
  handleEpub = async (result: ArrayBuffer) => {
    let rendition = new window.Kookit.EpubRender(result, this.state.readerMode);
    let bookLocation: {
      text: string;
      count: string;
      chapterTitle: string;
      chapterDocIndex: string;
      chapterHref: string;
      percentage: string;
      cfi: string;
    } = RecordLocation.getHtmlLocation(this.props.currentBook.key);
    await rendition.renderTo(
      document.getElementsByClassName("html-viewer-page")[0],
      bookLocation.cfi
    );
    await this.handleRest(rendition);
  };
  handleTxt = async (result: ArrayBuffer) => {
    const array = new Uint8Array(result as ArrayBuffer);
    let bufferStr = "";
    for (let i = 0; i < array.length; ++i) {
      bufferStr += String.fromCharCode(array[i]);
    }
    let charset = "";
    if (!this.props.currentBook.charset) {
      charset = await this.handleCharset(bufferStr);
    }
    let rendition = new window.Kookit.TxtRender(
      result,
      this.state.readerMode,
      this.props.currentBook.charset || charset || "utf8"
    );
    await rendition.renderTo(
      document.getElementsByClassName("html-viewer-page")[0]
    );
    await this.handleRest(rendition);
  };
  handleMD = (result: ArrayBuffer) => {
    var blob = new Blob([result], { type: "text/plain" });
    var reader = new FileReader();
    reader.onload = async (evt) => {
      let docStr = window.marked(evt.target?.result as any);
      let rendition = new window.Kookit.StrRender(
        docStr,
        this.state.readerMode
      );
      await rendition.renderTo(
        document.getElementsByClassName("html-viewer-page")[0]
      );
      await this.handleRest(rendition);
    };
    reader.readAsText(blob, "UTF-8");
  };
  handleRtf = async (result: ArrayBuffer) => {
    const array = new Uint8Array(result as ArrayBuffer);
    let bufferStr = "";
    for (let i = 0; i < array.length; ++i) {
      bufferStr += String.fromCharCode(array[i]);
    }
    rtfToHTML.fromString(bufferStr, async (err: any, html: any) => {
      let rendition = new window.Kookit.StrRender(
        removeExtraQuestionMark(html),
        this.state.readerMode
      );
      await rendition.renderTo(
        document.getElementsByClassName("html-viewer-page")[0]
      );
      await this.handleRest(rendition);
    });
  };
  handleDocx = (result: ArrayBuffer) => {
    window.mammoth
      .convertToHtml({ arrayBuffer: result })
      .then(async (res: any) => {
        let rendition = new window.Kookit.StrRender(
          res.value,
          this.state.readerMode
        );
        await rendition.renderTo(
          document.getElementsByClassName("html-viewer-page")[0]
        );
        await this.handleRest(rendition);
      });
  };
  handleFb2 = async (result: ArrayBuffer) => {
    let rendition = new window.Kookit.Fb2Render(result, this.state.readerMode);
    await rendition.renderTo(
      document.getElementsByClassName("html-viewer-page")[0]
    );
    await this.handleRest(rendition);
  };
  handleHtml = (result: ArrayBuffer, format: string) => {
    var blob = new Blob([result], {
      type: mimetype[format.toLocaleLowerCase()],
    });
    var reader = new FileReader();
    reader.onload = async (evt) => {
      let html = evt.target?.result as any;
      if (format === "MHTML") {
        html =
          mhtml2html.convert(html).window.document.documentElement.innerHTML;
      }
      let rendition = new window.Kookit.StrRender(html, this.state.readerMode);
      await rendition.renderTo(
        document.getElementsByClassName("html-viewer-page")[0]
      );
      await this.handleRest(rendition);
    };
    reader.readAsText(blob, "UTF-8");
  };
  render() {
    return (
      <>
        <div
          className="html-viewer-page"
          id="page-area"
          style={
            document.body.clientWidth < 570
              ? { left: 0, right: 0 }
              : this.state.readerMode === "scroll"
              ? {
                  paddingLeft: `calc(50vw - ${
                    270 * parseFloat(this.state.scale)
                  }px + 20px)`,
                  paddingRight: `calc(50vw - ${
                    270 * parseFloat(this.state.scale)
                  }px + 15px)`,
                  overflowY: "scroll",
                  overflowX: "hidden",
                }
              : this.state.readerMode === "single"
              ? {
                  left: `calc(50vw - ${
                    270 * parseFloat(this.state.scale)
                  }px + 15px)`,
                  right: `calc(50vw - ${
                    270 * parseFloat(this.state.scale)
                  }px + 15px)`,
                }
              : this.state.readerMode === "double"
              ? {
                  left: this.state.margin + 10 - this.state.extraMargin + "px",
                  right: this.state.margin + 10 - this.state.extraMargin + "px",
                }
              : {}
          }
        ></div>
        {StorageUtil.getReaderConfig("isHideBackground") === "yes" ? null : this
            .props.currentBook.key ? (
          <Background />
        ) : null}
        {this.props.htmlBook ? (
          <PopupMenu
            {...{
              rendition: this.props.htmlBook.rendition,
              rect: this.state.rect,
              pageWidth: this.state.pageWidth,
              pageHeight: this.state.pageHeight,
              chapterDocIndex: this.state.chapterDocIndex,
              chapter: this.state.chapter,
            }}
          />
        ) : null}
        {this.props.htmlBook && (
          <ImageViewer
            {...{
              isShow: this.props.isShow,
              rendition: this.props.htmlBook.rendition,
              handleEnterReader: this.props.handleEnterReader,
              handleLeaveReader: this.props.handleLeaveReader,
            }}
          />
        )}
      </>
    );
  }
}
export default withRouter(Viewer as any);
