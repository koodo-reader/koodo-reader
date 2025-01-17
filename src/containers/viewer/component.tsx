import React from "react";
import { ViewerProps, ViewerState } from "./interface";
import { withRouter } from "react-router-dom";
import BookUtil from "../../utils/file/bookUtil";
import PopupMenu from "../../components/popups/popupMenu";
import ConfigService from "../../utils/storage/configService";
import Background from "../../components/background";
import toast from "react-hot-toast";
import StyleUtil from "../../utils/reader/styleUtil";
import "./index.css";
import { HtmlMouseEvent } from "../../utils/reader/mouseEvent";
import ImageViewer from "../../components/imageViewer";
import { getIframeDoc } from "../../utils/reader/docUtil";
import { tsTransform } from "../../utils/reader/langUtil";
import { binicReadingProcess } from "../../utils/reader/bionicUtil";
import PopupBox from "../../components/popups/popupBox";
import Note from "../../models/Note";
import PageWidget from "../pageWidget";
import { getPageWidth, scrollContents } from "../../utils/common";
import _ from "underscore";
import { BookHelper } from "../../assets/lib/kookit-extra-browser.min";
import * as Kookit from "../../assets/lib/kookit.min";
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
      scale: ConfigService.getReaderConfig("scale") || 1,
      chapterTitle:
        ConfigService.getObjectConfig(
          this.props.currentBook.key,
          "recordLocation",
          {}
        ).chapterTitle || "",
      readerMode: ConfigService.getReaderConfig("readerMode") || "double",
      isDisablePopup: ConfigService.getReaderConfig("isDisablePopup") === "yes",
      isTouch: ConfigService.getReaderConfig("isTouch") === "yes",
      margin: parseInt(ConfigService.getReaderConfig("margin")) || 0,
      chapterDocIndex: parseInt(
        ConfigService.getObjectConfig(
          this.props.currentBook.key,
          "recordLocation",
          {}
        ).chapterDocIndex || 0
      ),
      pageOffset: "",
      pageWidth: "",
      chapter: "",
      rendition: null,
    };
    this.lock = false;
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchBookmarks();
    this.props.handleFetchNotes();
    this.props.handleFetchBooks();
    this.props.handleFetchPlugins();
  }
  componentDidMount() {
    this.handleRenderBook();
    //make sure page width is always 12 times, section = Math.floor(element.clientWidth / 12), or text will be blocked
    this.setState(
      getPageWidth(this.state.readerMode, this.state.scale, this.state.margin)
    );
    this.props.handleRenderBookFunc(this.handleRenderBook);

    window.addEventListener("resize", () => {
      BookUtil.reloadBooks();
    });
  }

  handleHighlight = async (rendition: any) => {
    let highlighters: any = this.props.notes;
    if (!highlighters) return;
    let highlightersByChapter = highlighters.filter((item: Note) => {
      if (item.bookKey !== this.props.currentBook.key) {
        return false;
      }

      let cfi = JSON.parse(item.cfi);
      if (cfi.cfi) {
        return (
          item.chapter ===
          rendition.getChapterDoc()[this.state.chapterDocIndex].label
        );
      } else {
        return (
          item.chapter ===
            rendition.getChapterDoc()[this.state.chapterDocIndex].label &&
          item.chapterIndex === this.state.chapterDocIndex
        );
      }
    });

    await this.props.htmlBook.rendition.renderHighlighters(
      highlightersByChapter,
      this.handleNoteClick
    );
  };
  handleNoteClick = (event: Event) => {
    this.props.handleNoteKey((event.target as any).dataset.key);
    this.props.handleMenuMode("note");
    this.props.handleOpenMenu(true);
  };
  handleRenderBook = async () => {
    if (lock) return;
    let { key, path, format, name } = this.props.currentBook;
    this.props.handleHtmlBook(null);
    let doc = getIframeDoc();
    if (doc && this.state.rendition) {
      this.state.rendition.removeContent();
    }
    let isCacheExsit = await BookUtil.isBookExist("cache-" + key, "zip", path);
    BookUtil.fetchBook(
      isCacheExsit ? "cache-" + key : key,
      isCacheExsit ? "zip" : format.toLowerCase(),
      true,
      path
    ).then(async (result: any) => {
      if (!result) {
        toast.error(this.props.t("Book not exsit"));
        return;
      }
      let rendition = BookHelper.getRendtion(
        result,
        isCacheExsit ? "CACHE" : format,
        this.state.readerMode,
        this.props.currentBook.charset,
        ConfigService.getReaderConfig("isSliding") === "yes" ? "sliding" : "",
        Kookit
      );

      await rendition.renderTo(document.getElementById("page-area"));
      await this.handleRest(rendition);
      this.props.handleReadingState(true);

      ConfigService.setListConfig(this.props.currentBook.key, "recentBooks");
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
    } = ConfigService.getObjectConfig(
      this.props.currentBook.key,
      "recordLocation",
      {}
    );
    if (chapterDocs.length > 0) {
      await rendition.goToPosition(
        JSON.stringify({
          text: bookLocation.text || "",
          chapterTitle: bookLocation.chapterTitle || "",
          page: bookLocation.page || "",
          chapterDocIndex: bookLocation.chapterDocIndex || 0,
          chapterHref: bookLocation.chapterHref || "",
          count: bookLocation.hasOwnProperty("cfi")
            ? "ignore"
            : bookLocation.count || 0,
          percentage: bookLocation.percentage,
          cfi: bookLocation.cfi,
          isFirst: true,
        })
      );
    }

    rendition.on("rendered", async () => {
      this.handleLocation();
      let bookLocation: {
        text: string;
        count: string;
        chapterTitle: string;
        chapterDocIndex: string;
        chapterHref: string;
      } = ConfigService.getObjectConfig(
        this.props.currentBook.key,
        "recordLocation",
        {}
      );

      let chapter =
        bookLocation.chapterTitle ||
        (this.props.htmlBook && this.props.htmlBook.flattenChapters[0]
          ? this.props.htmlBook.flattenChapters[0].label
          : "Unknown chapter");
      let chapterDocIndex = 0;
      if (bookLocation.chapterDocIndex) {
        chapterDocIndex = parseInt(bookLocation.chapterDocIndex);
      } else {
        chapterDocIndex =
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
            : 0;
      }
      this.props.handleCurrentChapter(chapter);
      this.props.handleCurrentChapterIndex(chapterDocIndex);
      this.props.handleFetchPercentage(this.props.currentBook);
      this.setState({
        chapter,
        chapterDocIndex,
      });
      scrollContents(chapter, bookLocation.chapterHref);
      StyleUtil.addDefaultCss();
      tsTransform();
      binicReadingProcess();
      this.handleBindGesture();
      await this.handleHighlight(rendition);
      lock = true;
      setTimeout(function () {
        lock = false;
      }, 1000);
      return false;
    });
  };

  handleLocation = () => {
    if (!this.props.htmlBook) {
      return;
    }
    let position = this.props.htmlBook.rendition.getPosition();
    ConfigService.setObjectConfig(
      this.props.currentBook.key,
      position,
      "recordLocation"
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
      if (this.state.isDisablePopup) {
        if (doc!.getSelection()!.toString().trim().length === 0) {
          let rect = doc!.getSelection()!.getRangeAt(0).getBoundingClientRect();
          this.setState({ rect });
        }
      }
      if (this.state.isDisablePopup) return;

      var rect = doc!.getSelection()!.getRangeAt(0).getBoundingClientRect();
      this.setState({ rect });
    });
    doc.addEventListener("contextmenu", (event) => {
      if (document.location.href.indexOf("localhost") === -1) {
        event.preventDefault();
      }

      if (!this.state.isDisablePopup && !this.state.isTouch) return;

      if (
        !doc!.getSelection() ||
        doc!.getSelection()!.toString().trim().length === 0
      )
        return;
      var rect = doc!.getSelection()!.getRangeAt(0).getBoundingClientRect();
      this.setState({ rect });
    });
  };
  render() {
    return (
      <>
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
        <div
          className={
            this.state.readerMode === "scroll"
              ? "html-viewer-page scrolling-html-viewer-page"
              : "html-viewer-page"
          }
          id="page-area"
          style={
            this.state.readerMode === "scroll" &&
            document.body.clientWidth >= 570
              ? {
                  marginLeft: this.state.pageOffset,
                  marginRight: this.state.pageOffset,
                  paddingLeft: "20px",
                  paddingRight: "15px",
                  left: 0,
                  right: 0,
                }
              : {
                  left: this.state.pageOffset,
                  width: this.state.pageWidth,
                }
          }
        ></div>
        <PageWidget />
        {ConfigService.getReaderConfig("isHideBackground") ===
        "yes" ? null : this.props.currentBook.key ? (
          <Background />
        ) : null}
      </>
    );
  }
}
export default withRouter(Viewer as any);
