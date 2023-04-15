import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import BookUtil from "../../utils/fileUtils/bookUtil";
import { toast } from "react-hot-toast";
import BackToMain from "../../components/backToMain";
import { djvuMouseEvent } from "../../utils/serviceUtils/mouseEvent";

declare var window: any;

class Viewer extends React.Component<ViewerProps, ViewerState> {
  constructor(props: ViewerProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    let url = document.location.href;
    let firstIndexOfQuestion = url.indexOf("?");
    let lastIndexOfSlash = url.lastIndexOf("/", firstIndexOfQuestion);
    let key = url.substring(lastIndexOfSlash + 1, firstIndexOfQuestion);

    localforage.getItem("books").then((result: any) => {
      let book;
      //兼容在主窗口打开
      if (this.props.currentBook.key) {
        book = this.props.currentBook;
      } else {
        book =
          result[window._.findIndex(result, { key })] ||
          JSON.parse(localStorage.getItem("tempBook") || "{}");
      }
      BookUtil.fetchBook(key, true, book.path).then((result) => {
        if (!result) {
          toast.error(this.props.t("Book not exsit"));
          return;
        }
        this.props.handleReadingBook(book);
        this.handleDjvu(result as ArrayBuffer);
        this.props.handleReadingState(true);
        RecentBooks.setRecent(key);
        document.title = book.name + " - Koodo Reader";
      });
    });
    document
      .querySelector(".ebook-viewer")
      ?.setAttribute("style", "height:100vh");
  }

  handleDjvu = async (result: ArrayBuffer) => {
    setTimeout(() => {
      var ViewerInstance = new window.DjVu.Viewer();
      ViewerInstance.render(document.querySelector(".ebook-viewer"));
      ViewerInstance.loadDocument(result);
      djvuMouseEvent();
    }, 100);
  };

  render() {
    return (
      <div>
        <div className="ebook-viewer" id="page-area">
          Loading
        </div>
        <BackToMain />
      </div>
    );
  }
}
export default withRouter(Viewer as any);
