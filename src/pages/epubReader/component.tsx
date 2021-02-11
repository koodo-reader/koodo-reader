//卡片模式下的图书显示
import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
// import "./bookCardItem.css";
import { EpubReaderProps, EpubReaderState } from "./interface";
import localforage from "localforage";
import Reader from "../../containers/epubViewer";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/bookUtil";

declare var window: any;

class EpubReader extends React.Component<EpubReaderProps, EpubReaderState> {
  epub: any;
  constructor(props: EpubReaderProps) {
    super(props);
    this.state = {};
  }

  componentWillMount() {
    let url = document.location.href.split("/");
    let key = url[url.length - 1];

    localforage.getItem("books").then((result: any) => {
      let book = result[_.findIndex(result, { key })];
      BookUtil.fetchBook(key).then((result) => {
        this.props.handleReadingBook(book);
        this.props.handleReadingEpub(window.ePub(result, {}));
        this.props.handleReadingState(true);
        RecentBooks.setRecent(key);
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
export default withRouter(EpubReader);
