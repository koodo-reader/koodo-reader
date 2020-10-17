//卡片模式下的图书显示
import React from "react";
import RecentBooks from "../../utils/recordRecent";
// import "./bookCardItem.css";
import { PdfReaderProps, PdfReaderState } from "./interface";
import localforage from "localforage";
import Reader from "../../containers/epubViewer";
import { withRouter } from "react-router-dom";
import _ from "underscore";

declare var window: any;

class PdfReader extends React.Component<PdfReaderProps, PdfReaderState> {
  componentWillMount() {
    let url = document.location.href.split("/");
    let key = url[url.length - 1];
    localforage.getItem("books").then((result: any) => {
      let book = result[_.findIndex(result, { key })];
      localforage.getItem(key).then((result) => {
        this.props.handleReadingBook(book);
        this.props.handleReadingState(true);
        RecentBooks.setRecent(key);
        this.props.history.push(
          `/lib/pdf/viewer.html?file=${this.props.book.key}.blob`
        );
      });
    });
  }

  render() {
    if (!this.props.isReading) {
      return (
        <div className="spinner">
          <div className="sk-chase">
            <div className="sk-chase-dot"></div>
            <div className="sk-chase-dot"></div>
            <div className="sk-chase-dot"></div>
            <div className="sk-chase-dot"></div>
            <div className="sk-chase-dot"></div>
            <div className="sk-chase-dot"></div>
          </div>
        </div>
      );
    }
    return <Reader />;
  }
}
export default withRouter(PdfReader);
