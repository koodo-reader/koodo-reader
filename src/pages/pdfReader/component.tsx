import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/fileUtils/bookUtil";
import BackToMain from "../../components/backToMain";
import PopupMenu from "../../components/popups/popupMenu";
import {
  showHighlight,
  getHightlightCoords,
} from "../../utils/fileUtils/pdfUtil";

class Viewer extends React.Component<ViewerProps, ViewerState> {
  epub: any;
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
  componentWillMount() {
    this.props.handleFetchBookmarks();
    this.props.handleFetchNotes();
    this.props.handleFetchBooks();
  }
  componentDidMount() {
    let url = document.location.href.split("/");
    let key = url[url.length - 1].split("?")[0];
    localforage.getItem("books").then((result: any) => {
      let book;
      if (this.props.currentBook.key) {
        book = this.props.currentBook;
      } else {
        book =
          result[_.findIndex(result, { key })] ||
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
    let iframe = document.getElementsByTagName("iframe")[0];
    iframe.onload = () => {
      let doc: any =
        iframe.contentWindow || iframe.contentDocument?.defaultView;
      this.setState({ loading: false });
      doc.document.addEventListener("mouseup", () => {
        if (!doc!.getSelection()) return;
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
      <div className="ebook-viewer">
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
              chapterIndex: 0,
              chapter: "test",
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
        <BackToMain />
      </div>
    );
  }
}
export default withRouter(Viewer as any);
