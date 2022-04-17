import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import BookUtil from "../../utils/fileUtils/bookUtil";
import iconv from "iconv-lite";
import chardet from "chardet";
import rtfToHTML from "@iarna/rtf-to-html";
import PopupMenu from "../../components/popups/popupMenu";
import { xmlBookParser } from "../../utils/fileUtils/xmlUtil";
import StorageUtil from "../../utils/serviceUtils/storageUtil";
import RecordLocation from "../../utils/readUtils/recordLocation";
import { mimetype } from "../../constants/mimetype";
import Background from "../../components/background";
import toast from "react-hot-toast";
import StyleUtil from "../../utils/readUtils/styleUtil";
import "./index.css";
import { HtmlMouseEvent } from "../../utils/serviceUtils/mouseEvent";
import untar from "js-untar";
import ImageViewer from "../../components/imageViewer";
import _ from "underscore";
import { removeExtraQuestionMark } from "../../utils/fileUtils/rtfUtil";
import { getIframeDoc } from "../../utils/serviceUtils/docUtil";
import { tsTransform } from "../../utils/serviceUtils/langUtil";

declare var window: any;
let lock = false; //prevent from clicking too fasts
const {
  MobiRender,
  Azw3Render,
  EpubRender,
  TxtRender,
  StrRender,
  ComicRender,
} = window.Kookit;
let Unrar = window.Unrar;
let JSZip = window.JSZip;

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
      margin: parseInt(StorageUtil.getReaderConfig("margin")) || 30,
      chapterIndex: 0,
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

    this.props.handleRenderFunc(this.handleRenderBook);

    var doit;
    window.addEventListener("resize", () => {
      clearTimeout(doit);
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
      }
      doit = setTimeout(this.handleRenderBook, 1000);
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

    this.handlePageWidth();

    window.rangy.init();
    BookUtil.fetchBook(key, true, path).then((result) => {
      if (!result) {
        toast.error(this.props.t("Book not exsits"));
        return;
      }

      if (format === "MOBI") {
        this.handleMobi(result as ArrayBuffer);
      } else if (format === "AZW3") {
        this.handleAzw3(result as ArrayBuffer);
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
        format === "HTM" ||
        format === "XML"
      ) {
        this.handleHtml(result as ArrayBuffer, format);
      } else if (format === "CBR") {
        this.handleCbr(result as ArrayBuffer);
      } else if (format === "CBT") {
        this.handleCbt(result as ArrayBuffer);
      } else if (format === "CBZ") {
        this.handleCbz(result as ArrayBuffer);
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
    let chapters = await rendition.getChapter();
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
    rendition.setStyle(
      StyleUtil.getCustomCss(
        this.props.currentBook.format === "EPUB" ? false : true
      )
    );

    let bookLocation: {
      text: string;
      count: string;
      chapterTitle: string;
      percentage: string;
      cfi: string;
    } = RecordLocation.getHtmlLocation(this.props.currentBook.key);
    await rendition.goToPosition(
      JSON.stringify({
        text: bookLocation.text,
        chapterTitle: bookLocation.chapterTitle,
        count: bookLocation.count,
        percentage: bookLocation.percentage,
        cfi: bookLocation.cfi,
      })
    );

    rendition.on("rendered", () => {
      let bookLocation: { text: string; count: string; chapterTitle: string } =
        RecordLocation.getHtmlLocation(this.props.currentBook.key);
      this.props.handleCurrentChapter(bookLocation.chapterTitle);
      if (this.props.currentBook.format.startsWith("CB")) {
        this.setState({
          chapter:
            this.props.htmlBook.flattenChapters[
              parseInt(bookLocation.count) || 0
            ].label,
          chapterIndex: parseInt(bookLocation.count) || 0,
        });
      } else {
        this.setState({
          chapter:
            bookLocation.chapterTitle ||
            (this.props.htmlBook
              ? this.props.htmlBook.flattenChapters[0].label
              : "Unknown Chapter"),
          chapterIndex:
            bookLocation.chapterTitle && this.props.htmlBook
              ? _.findLastIndex(
                  this.props.htmlBook.flattenChapters.map((item) => {
                    item.label = item.label.trim();
                    return item;
                  }),
                  {
                    label: bookLocation.chapterTitle.trim(),
                  }
                )
              : 0,
        });
      }
      tsTransform();
      let doc = getIframeDoc();
      if (!doc) return;
      doc.addEventListener("click", (event) => {
        this.props.handleLeaveReader("left");
        this.props.handleLeaveReader("right");
        this.props.handleLeaveReader("top");
        this.props.handleLeaveReader("bottom");
      });
      doc.addEventListener("mouseup", () => {
        if (!doc!.getSelection()) return;
        var rect = doc!.getSelection()!.getRangeAt(0).getBoundingClientRect();
        this.setState({ rect });
      });
      lock = true;
      setTimeout(function () {
        lock = false;
      }, 1000);
      return false;
    });
  };
  handleCbr = async (result: ArrayBuffer) => {
    let unrar = new Unrar(result);
    var entries = unrar.getEntries();
    let bookLocation = RecordLocation.getHtmlLocation(
      this.props.currentBook.key
    );
    let rendition = new ComicRender(
      entries.map((item: any) => item.name),
      unrar,
      this.state.readerMode,
      "cbr",
      StorageUtil.getReaderConfig("isSliding") === "yes" ? true : false
    );
    await rendition.renderTo(
      document.getElementsByClassName("html-viewer-page")[0],
      parseInt(bookLocation.count) || 0
    );
    this.handleRest(rendition);
  };
  handleCbz = (result: ArrayBuffer) => {
    let zip = new JSZip();
    let bookLocation = RecordLocation.getHtmlLocation(
      this.props.currentBook.key
    );
    zip.loadAsync(result).then(async (contents) => {
      let rendition = new ComicRender(
        Object.keys(contents.files).sort(),
        zip,
        this.state.readerMode,
        "cbz",
        StorageUtil.getReaderConfig("isSliding") === "yes" ? true : false
      );
      await rendition.renderTo(
        document.getElementsByClassName("html-viewer-page")[0],
        parseInt(bookLocation.count) || 0
      );
      this.handleRest(rendition);
    });
  };
  handleCbt = (result: ArrayBuffer) => {
    let bookLocation = RecordLocation.getHtmlLocation(
      this.props.currentBook.key
    );
    untar(result).then(
      async (extractedFiles) => {
        let rendition = new ComicRender(
          extractedFiles.map((item: any) => item.name),
          extractedFiles,
          this.state.readerMode,
          "cbt",
          StorageUtil.getReaderConfig("isSliding") === "yes" ? true : false
        );
        await rendition.renderTo(
          document.getElementsByClassName("html-viewer-page")[0],
          parseInt(bookLocation.count) || 0
        );
        this.handleRest(rendition);
      },
      function (err) {
        // onError
      },
      function (extractedFile) {
        // onProgress
      }
    );
  };
  handleMobi = async (result: ArrayBuffer) => {
    let rendition = new MobiRender(
      result,
      this.state.readerMode,
      StorageUtil.getReaderConfig("isSliding") === "yes" ? true : false
    );
    await rendition.renderTo(
      document.getElementsByClassName("html-viewer-page")[0]
    );
    this.handleRest(rendition);
  };
  handleEpub = async (result: ArrayBuffer) => {
    let rendition = new EpubRender(
      result,
      this.state.readerMode,
      StorageUtil.getReaderConfig("isSliding") === "yes" ? true : false
    );
    let bookLocation: {
      text: string;
      count: string;
      chapterTitle: string;
      percentage: string;
      cfi: string;
    } = RecordLocation.getHtmlLocation(this.props.currentBook.key);
    await rendition.renderTo(
      document.getElementsByClassName("html-viewer-page")[0],
      bookLocation.cfi
    );
    this.handleRest(rendition);
  };
  handleAzw3 = async (result: ArrayBuffer) => {
    let rendition = new Azw3Render(
      result,
      this.state.readerMode,
      StorageUtil.getReaderConfig("isSliding") === "yes" ? true : false
    );
    await rendition.renderTo(
      document.getElementsByClassName("html-viewer-page")[0]
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
      this.state.readerMode,
      this.props.currentBook.charset || charset || "utf8",
      StorageUtil.getReaderConfig("isSliding") === "yes" ? true : false
    );
    await rendition.renderTo(
      document.getElementsByClassName("html-viewer-page")[0]
    );
    this.handleRest(rendition);
  };
  handleMD = (result: ArrayBuffer) => {
    var blob = new Blob([result], { type: "text/plain" });
    var reader = new FileReader();
    reader.onload = async (evt) => {
      let docStr = window.marked(evt.target?.result as any);
      let rendition = new StrRender(
        docStr,
        this.state.readerMode,
        StorageUtil.getReaderConfig("isSliding") === "yes" ? true : false
      );
      await rendition.renderTo(
        document.getElementsByClassName("html-viewer-page")[0]
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
      let rendition = new StrRender(
        removeExtraQuestionMark(html),
        this.state.readerMode,
        StorageUtil.getReaderConfig("isSliding") === "yes" ? true : false
      );
      await rendition.renderTo(
        document.getElementsByClassName("html-viewer-page")[0]
      );
      this.handleRest(rendition);
    });
  };
  handleDocx = (result: ArrayBuffer) => {
    window.mammoth
      .convertToHtml({ arrayBuffer: result })
      .then(async (res: any) => {
        let rendition = new StrRender(
          res.value,
          this.state.readerMode,
          StorageUtil.getReaderConfig("isSliding") === "yes" ? true : false
        );
        await rendition.renderTo(
          document.getElementsByClassName("html-viewer-page")[0]
        );
        this.handleRest(rendition);
      });
  };
  toBuffer(ab) {
    const buf = Buffer.alloc(ab.byteLength);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
      buf[i] = view[i];
    }
    return buf;
  }
  handleFb2 = async (result: ArrayBuffer) => {
    let charset = "";
    if (!this.props.currentBook.charset) {
      charset = await this.handleCharset(result);
    }
    let fb2Str = iconv.decode(
      Buffer.from(result),
      this.props.currentBook.charset || charset || "utf8"
    );
    let bookObj = xmlBookParser(Buffer.from(result), fb2Str);
    let rendition = new StrRender(
      bookObj,
      this.state.readerMode,
      StorageUtil.getReaderConfig("isSliding") === "yes" ? true : false
    );
    await rendition.renderTo(
      document.getElementsByClassName("html-viewer-page")[0]
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
      let rendition = new StrRender(
        html,
        this.state.readerMode,
        StorageUtil.getReaderConfig("isSliding") === "yes" ? true : false
      );
      await rendition.renderTo(
        document.getElementsByClassName("html-viewer-page")[0]
      );
      this.handleRest(rendition);
    };
    reader.readAsText(blob, "UTF-8");
  };
  render() {
    let extraMargin =
      this.props.currentBook.format === "EPUB"
        ? (document.body.clientWidth - 2 * this.state.margin - 20) / 24
        : 0;
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
                  left: `calc(50vw - ${
                    270 * parseFloat(this.state.scale)
                  }px + 20px)`,
                  right: `calc(50vw - ${
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
                  left: this.state.margin + 10 - extraMargin + "px",
                  right: this.state.margin + 10 - extraMargin + "px",
                }
              : {}
          }
        ></div>
        {StorageUtil.getReaderConfig("isHideBackground") === "yes" ? null : this
            .props.currentBook.key ? (
          <Background />
        ) : null}
        {this.props.htmlBook && (
          <PopupMenu
            {...{
              rendition: this.props.htmlBook.rendition,
              rect: this.state.rect,
              pageWidth: this.state.pageWidth,
              pageHeight: this.state.pageHeight,
              chapterIndex: this.state.chapterIndex,
              chapter: this.state.chapter,
            }}
          />
        )}
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
