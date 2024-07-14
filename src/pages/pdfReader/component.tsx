import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import { Tooltip } from "react-tooltip";
import { withRouter } from "react-router-dom";
import BookUtil from "../../utils/fileUtils/bookUtil";
import PDFWidget from "../../components/pdfWidget";
import PopupMenu from "../../components/popups/popupMenu";
import { Toaster } from "react-hot-toast";
import { handleLinkJump } from "../../utils/readUtils/linkUtil";
import { pdfMouseEvent } from "../../utils/serviceUtils/mouseEvent";
import StorageUtil from "../../utils/serviceUtils/storageUtil";
import PopupBox from "../../components/popups/popupBox";
import { renderHighlighters } from "../../utils/serviceUtils/noteUtil";
import { getPDFIframeDoc } from "../../utils/serviceUtils/docUtil";
import Note from "../../models/Note";
import RecordLocation from "../../utils/readUtils/recordLocation";
declare var window: any;
class Viewer extends React.Component<ViewerProps, ViewerState> {
  constructor(props: ViewerProps) {
    super(props);
    this.state = {
      href: "",
      title: "",
      cfiRange: null,
      contents: null,
      rect: null,
      loading: true,
      chapterDocIndex: parseInt(
        RecordLocation.getHtmlLocation(this.props.currentBook.key)
          .chapterDocIndex || 0
      ),
      isDisablePopup: StorageUtil.getReaderConfig("isDisablePopup") === "yes",
      isTouch: StorageUtil.getReaderConfig("isTouch") === "yes",
    };
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchBookmarks();
    this.props.handleFetchNotes();
    this.props.handleFetchBooks();
  }
  componentDidMount() {
    let url = document.location.href;
    let firstIndexOfQuestion = url.indexOf("?");
    let lastIndexOfSlash = url.lastIndexOf("/", firstIndexOfQuestion);
    let key = url.substring(lastIndexOfSlash + 1, firstIndexOfQuestion);
    window.localforage.getItem("books").then((result: any) => {
      let book =
        result[window._.findIndex(result, { key })] ||
        JSON.parse(localStorage.getItem("tempBook") || "{}");

      document.title = book.name + " - Koodo Reader";
      this.props.handleReadingState(true);
      RecentBooks.setRecent(key);
      this.props.handleReadingBook(book);
      this.setState({ title: book.name + " - Koodo Reader" });
      this.setState({ href: BookUtil.getPDFUrl(book) });
    });
    document
      .querySelector(".ebook-viewer")
      ?.setAttribute("style", "height:100%; overflow: hidden;");
    let pageArea = document.getElementById("page-area");
    if (!pageArea) return;
    let iframe = pageArea.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    iframe.onload = () => {
      let doc: any =
        iframe.contentWindow || iframe.contentDocument?.defaultView;
      this.setState({ loading: false });
      pdfMouseEvent();
      doc.document.addEventListener("click", async (event: any) => {
        event.preventDefault();
        await handleLinkJump(event);
      });
      doc.document.addEventListener("mouseup", (event) => {
        if (this.state.isDisablePopup) return;
        if (!doc!.getSelection() || doc!.getSelection().rangeCount === 0)
          return;
        event.preventDefault();
        var rect = doc!.getSelection()!.getRangeAt(0).getBoundingClientRect();
        this.setState({
          rect,
        });
        // iWin.getSelection() && showHighlight(getHightlightCoords());
      });
      doc.addEventListener("contextmenu", (event) => {
        if (document.location.href.indexOf("localhost") === -1) {
          event.preventDefault();
        }

        if (!this.state.isDisablePopup && !this.state.isTouch) return;
        if (!doc!.getSelection() || doc!.getSelection().rangeCount === 0)
          return;

        var rect = doc!.getSelection()!.getRangeAt(0).getBoundingClientRect();
        this.setState({
          rect,
        });
      });

      setTimeout(() => {
        this.handleHighlight();
        let iWin = getPDFIframeDoc();
        if (!iWin) return;
        if (!iWin.PDFViewerApplication.eventBus) return;
        iWin.PDFViewerApplication.eventBus.on(
          "pagechanging",
          this.handleHighlight
        );
      }, 3000);
    };
  }
  handleHighlight = () => {
    let highlighters: any = this.props.notes;
    if (!highlighters) return;
    let highlightersByChapter = highlighters.filter((item: Note) => {
      return (
        item.chapterIndex === this.state.chapterDocIndex &&
        item.bookKey === this.props.currentBook.key
      );
    });
    renderHighlighters(
      highlightersByChapter,
      this.props.currentBook.format,
      this.handleNoteClick
    );
  };
  handleNoteClick = (event: Event) => {
    this.props.handleNoteKey((event.target as any).dataset.key);
    this.props.handleMenuMode("note");
    this.props.handleOpenMenu(true);
  };
  render() {
    return (
      <div className="ebook-viewer" id="page-area">
        <Tooltip id="my-tooltip" style={{ zIndex: 25 }} />
        {!this.state.loading && (
          <PopupMenu
            {...{
              rendition: {
                on: (status: string, callback: any) => {
                  callback();
                },
              },
              rect: this.state.rect,
              chapterDocIndex: 0,
              chapter: "0",
            }}
          />
        )}
        {this.props.isOpenMenu &&
        (this.props.menuMode === "dict" ||
          this.props.menuMode === "trans" ||
          this.props.menuMode === "note") ? (
          <PopupBox
            {...{
              rendition: {
                on: (status: string, callback: any) => {
                  callback();
                },
              },
              rect: this.state.rect,
              chapterDocIndex: 0,
              chapter: "0",
            }}
          />
        ) : null}
        <iframe
          src={this.state.href}
          title={this.state.title}
          width="100%"
          height="100%"
        >
          Loading
        </iframe>
        <PDFWidget /> <Toaster />
      </div>
    );
  }
}
export default withRouter(Viewer as any);
