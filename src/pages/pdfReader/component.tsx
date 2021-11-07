import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/fileUtils/bookUtil";
import BackToMain from "../../components/backToMain";
import PopupMenu from "../../components/popups/popupMenu";

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
    };
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
      setTimeout(() => {}, 1000);
    });
    document
      .querySelector(".ebook-viewer")
      ?.setAttribute("style", "height:100%");
    let iframe = document.getElementsByTagName("iframe")[0];
    iframe.onload = () => {
      let iWin: any =
        iframe.contentWindow || iframe.contentDocument?.defaultView;
      iWin.document.addEventListener("mouseup", () => {
        iWin.getSelection() && this.showHighlight(this.getHightlightCoords());
      });
    };
  }
  getHightlightCoords() {
    let iframe = document.getElementsByTagName("iframe")[0];
    let iWin: any = iframe.contentWindow || iframe.contentDocument?.defaultView;
    var pageIndex = iWin!.PDFViewerApplication.pdfViewer.currentPageNumber - 1;
    var page = iWin!.PDFViewerApplication.pdfViewer.getPageView(pageIndex);
    var pageRect = page.canvas.getClientRects()[0];
    var selectionRects = iWin.getSelection()!.getRangeAt(0).getClientRects();
    console.log(selectionRects);
    var viewport = page.viewport;
    var selected = Array.from(selectionRects).map(function (r: any) {
      return viewport
        .convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y)
        .concat(
          viewport.convertToPdfPoint(
            r.right - pageRect.x,
            r.bottom - pageRect.y
          )
        );
    });
    return { page: pageIndex, coords: selected };
  }

  showHighlight(selected) {
    let iframe = document.getElementsByTagName("iframe")[0];
    let iWin: any = iframe.contentWindow || iframe.contentDocument?.defaultView;
    var pageIndex = selected.page;
    var page = iWin.PDFViewerApplication.pdfViewer.getPageView(pageIndex);
    var pageElement = page.textLayer.textLayerDiv;
    console.log(page);
    var viewport = page.viewport;
    selected.coords.forEach(function (rect) {
      var bounds = viewport.convertToViewportRectangle(rect);
      var el = iWin.document.createElement("div");
      el.setAttribute(
        "style",
        "position: absolute; background-color: red;" +
          "left:" +
          Math.min(bounds[0], bounds[2]) +
          "px; top:" +
          Math.min(bounds[1], bounds[3]) +
          "px;" +
          "width:" +
          Math.abs(bounds[0] - bounds[2]) +
          "px; height:" +
          Math.abs(bounds[1] - bounds[3]) +
          "px; z-index:" +
          "-1"
      );
      pageElement.appendChild(el);
    });
    console.log(pageElement);
  }
  render() {
    const popupMenuProps = {
      rendition: {},
      cfiRange: this.state.cfiRange,
      contents: this.state.contents,
      rect: this.state.rect,
    };
    return (
      <div className="ebook-viewer">
        {/* <PopupMenu {...popupMenuProps} /> */}
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
