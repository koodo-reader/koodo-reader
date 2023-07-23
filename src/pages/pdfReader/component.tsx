import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";

import { withRouter } from "react-router-dom";
import BookUtil from "../../utils/fileUtils/bookUtil";
import BackToMain from "../../components/backToMain";
import PopupMenu from "../../components/popups/popupMenu";
import { Toaster } from "react-hot-toast";
import { handleLinkJump } from "../../utils/readUtils/linkUtil";
import { pdfMouseEvent } from "../../utils/serviceUtils/mouseEvent";
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
      pageWidth: 0,
      pageHeight: 0,
      loading: true,
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
      let book;
      if (this.props.currentBook.key) {
        book = this.props.currentBook;
      } else {
        book =
          result[window._.findIndex(result, { key })] ||
          JSON.parse(localStorage.getItem("tempBook") || "{}");
      }

      document.title = book.name + " - Koodo Reader";
      this.props.handleReadingState(true);
      RecentBooks.setRecent(key);
      this.props.handleReadingBook(book);
      this.setState({ title: book.name + " - Koodo Reader" });
      this.setState({ href: BookUtil.getPDFUrl(book) });
    });
    document
      .querySelector(".ebook-viewer")
      ?.setAttribute("style", "height:100%");
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

      doc.document.addEventListener("mouseup", () => {
        if (!doc!.getSelection() || doc!.getSelection().rangeCount === 0)
          return;

        var rect = doc!.getSelection()!.getRangeAt(0).getBoundingClientRect();
        this.setState({
          rect,
          pageWidth: doc.document.body.scrollWidth,
          pageHeight: doc.document.body.scrollHeight,
        });
        // iWin.getSelection() && showHighlight(getHightlightCoords());
      });
    };
  }

  render() {
    return (
      <div className="ebook-viewer" id="page-area">
        {!this.state.loading && (
          <PopupMenu
            {...{
              rendition: {
                on: (status: string, callback: any) => {
                  callback();
                },
              },
              rect: this.state.rect,
              pageWidth: this.state.pageWidth,
              pageHeight: this.state.pageHeight,
              chapterDocIndex: 0,
              chapter: "0",
            }}
          />
        )}
        <iframe
          src={this.state.href}
          title={this.state.title}
          width="100%"
          height="100%"
        >
          Loading
        </iframe>
        <BackToMain /> <Toaster />
      </div>
    );
  }
}
export default withRouter(Viewer as any);
