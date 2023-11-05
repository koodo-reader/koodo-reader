import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import { withRouter } from "react-router-dom";
import BookUtil from "../../utils/fileUtils/bookUtil";
import PopupMenu from "../../components/popups/popupMenu";
import StorageUtil from "../../utils/serviceUtils/storageUtil";
import RecordLocation from "../../utils/readUtils/recordLocation";
import Background from "../../components/background";
import toast from "react-hot-toast";
import StyleUtil from "../../utils/readUtils/styleUtil";
import "./index.css";
import { HtmlMouseEvent } from "../../utils/serviceUtils/mouseEvent";
import ImageViewer from "../../components/imageViewer";
import { getIframeDoc } from "../../utils/serviceUtils/docUtil";
import { tsTransform } from "../../utils/serviceUtils/langUtil";
import CFI from "epub-cfi-resolver";
import { binicReadingProcess } from "../../utils/serviceUtils/bionicUtil";
import PopupBox from "../../components/popups/popupBox";
import { renderHighlighters } from "../../utils/serviceUtils/noteUtil";
import Note from "../../model/Note";

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

      margin: parseInt(StorageUtil.getReaderConfig("margin")) || 0,
      chapterDocIndex: parseInt(
        RecordLocation.getHtmlLocation(this.props.currentBook.key)
          .chapterDocIndex || 0
      ),
      chapter: "",
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
    window.rangy.init();
    this.handleRenderBook();

    this.props.handleRenderBookFunc(this.handleRenderBook);

    window.addEventListener("resize", () => {
      if (StorageUtil.getReaderConfig("isFullscreen") === "yes") {
        this.handleRenderBook();
      } else {
        BookUtil.reloadBooks();
      }
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
  handleHighlight = (rendition: any) => {
    let highlighters: any = this.props.notes;
    if (!highlighters) return;
    let highlightersByChapter = highlighters.filter((item: Note) => {
      if (this.props.currentBook.format !== "PDF") {
        return (
          (item.chapter ===
            rendition.getChapterDoc()[this.state.chapterDocIndex].label ||
            item.chapterIndex === this.state.chapterDocIndex) &&
          item.bookKey === this.props.currentBook.key
        );
      } else {
        return (
          item.chapterIndex === this.state.chapterDocIndex &&
          item.bookKey === this.props.currentBook.key
        );
      }
    });

    renderHighlighters(
      highlightersByChapter,
      this.props.currentBook.format,
      this.handleNoteClick
    );
  };
  handleNoteClick = (event: Event) => {
    if (event && event.target) {
      this.props.handleNoteKey((event.target as any).dataset.key);
      this.props.handleMenuMode("note");
      this.props.handleOpenMenu(true);
    }
  };
  handleRenderBook = async () => {
    if (lock) return;
    let { key, path, format, name } = this.props.currentBook;
    this.props.handleHtmlBook(null);
    let doc = getIframeDoc();
    if (doc && this.state.rendition) {
      this.state.rendition.removeContent();
    }

    StorageUtil.getReaderConfig("readerMode") !== "scroll" &&
      this.handlePageWidth();

    let isCacheExsit = await BookUtil.isBookExist("cache-" + key, path);
    BookUtil.fetchBook(isCacheExsit ? "cache-" + key : key, true, path).then(
      async (result: any) => {
        if (!result) {
          toast.error(this.props.t("Book not exsit"));
          return;
        }
        let rendition = BookUtil.getRendtion(
          result,
          isCacheExsit ? "CACHE" : format,
          this.state.readerMode,
          this.props.currentBook.charset
        );

        await rendition.renderTo(
          document.getElementsByClassName("html-viewer-page")[0]
        );
        await this.handleRest(rendition);
        this.props.handleReadingState(true);

        RecentBooks.setRecent(this.props.currentBook.key);
        document.title = name + " - Koodo Reader";
      }
    );
  };

  handleRest = async (rendition: any) => {
    HtmlMouseEvent(
      rendition,
      this.props.currentBook.key,
      this.state.readerMode
    );
    let chapters = rendition.getChapter();
    let chapterDocs = rendition.getChapterDoc();
    let flattenChapters = rendition.flatChapter(chapters);
    this.props.handleHtmlBook({
      key: this.props.currentBook.key,
      chapters,
      flattenChapters,
      rendition: rendition,
    });
    this.setState({ rendition });

    StyleUtil.addDefaultCss();
    tsTransform();
    binicReadingProcess();
    // rendition.setStyle(StyleUtil.getCustomCss());
    let bookLocation: {
      text: string;
      count: string;
      chapterTitle: string;
      chapterDocIndex: string;
      chapterHref: string;
      percentage: string;
      cfi: string;
      page: string;
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
    } else if (chapterDocs.length > 0) {
      await rendition.goToPosition(
        JSON.stringify({
          text: bookLocation.text || "",
          chapterTitle: bookLocation.chapterTitle || chapterDocs[0].label,
          page: bookLocation.page || "",
          chapterDocIndex: bookLocation.chapterDocIndex || 0,
          chapterHref: bookLocation.chapterHref || chapterDocs[0].href,
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
        (this.props.htmlBook && this.props.htmlBook.flattenChapters[0]
          ? this.props.htmlBook.flattenChapters[0].label
          : "Unknown Chapter");
      let chapterDocIndex = 0;
      if (bookLocation.chapterDocIndex) {
        chapterDocIndex = parseInt(bookLocation.chapterDocIndex);
      } else {
        chapterDocIndex =
          bookLocation.chapterTitle && this.props.htmlBook
            ? window._.findLastIndex(
                this.props.htmlBook.flattenChapters.map((item) => {
                  item.label = item.label.trim();
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
      this.handleHighlight(rendition);
      lock = true;
      setTimeout(function () {
        lock = false;
      }, 1000);
      return false;
    });
  };
  handleContentScroll = (chapter: string, chapterHref: string) => {
    if (!chapterHref) return;
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
      contentBody.scrollTo({
        left: 0,
        top: targetContent[0].offsetTop,
        behavior: "smooth",
      });
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
      position.cfi,
      position.page
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
  render() {
    return (
      <>
        <div
          className={
            this.state.readerMode === "scroll"
              ? "html-viewer-page scrolling-html-viewer-page"
              : "html-viewer-page"
          }
          id="page-area"
          style={
            document.body.clientWidth < 570
              ? { left: 0, right: 0 }
              : this.state.readerMode === "scroll"
              ? {
                  marginLeft: `calc(50vw - ${
                    270 * parseFloat(this.state.scale)
                  }px)`,
                  marginRight: `calc(50vw - ${
                    270 * parseFloat(this.state.scale)
                  }px)`,
                  paddingLeft: "20px",
                  paddingRight: "15px",
                  left: 0,
                  right: 0,
                }
              : this.state.readerMode === "single"
              ? {
                  left: `calc(50vw - ${
                    270 * parseFloat(this.state.scale)
                  }px + 30px)`,
                  right: `calc(50vw - ${
                    270 * parseFloat(this.state.scale)
                  }px + 30px)`,
                }
              : this.state.readerMode === "double"
              ? {
                  left: 40 + this.state.margin + "px",
                  right: 40 + this.state.margin + "px",
                }
              : {}
          }
        ></div>
        {StorageUtil.getReaderConfig("isHideBackground") === "yes" ||
        (StorageUtil.getReaderConfig("backgroundColor") &&
          StorageUtil.getReaderConfig("backgroundColor").startsWith(
            "#"
          )) ? null : this.props.currentBook.key ? (
          <Background />
        ) : null}
        {this.props.htmlBook ? (
          <PopupMenu
            {...{
              rendition: this.props.htmlBook.rendition,
              rect: this.state.rect,
              chapterDocIndex: this.state.chapterDocIndex,
              chapter: this.state.chapter,
            }}
          />
        ) : null}
        {this.props.isOpenMenu &&
        this.props.htmlBook &&
        (this.props.menuMode === "dict" ||
          this.props.menuMode === "trans" ||
          this.props.menuMode === "note") ? (
          <PopupBox
            {...{
              rendition: this.props.htmlBook.rendition,
              rect: this.state.rect,
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
