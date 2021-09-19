import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { EpubReaderProps, EpubReaderState } from "./interface";
import localforage from "localforage";
import Reader from "../../containers/epubReader";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/fileUtils/bookUtil";
import Lottie from "react-lottie";
import "../../assets/styles/reset.css";
import animationSiri from "../../assets/lotties/siri.json";
import BookModel from "../../model/Book";
import { Toaster } from "react-hot-toast";

const siriOptions = {
  loop: true,
  autoplay: true,
  animationData: animationSiri,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};
declare var window: any;

class EpubReader extends React.Component<EpubReaderProps, EpubReaderState> {
  epub: any;
  constructor(props: EpubReaderProps) {
    super(props);
    this.state = {};
  }

  componentWillMount() {
    let url = document.location.href.split("/");
    let key = url[url.length - 1].split("?")[0];

    localforage.getItem("books").then((result: any) => {
      let book: BookModel = result[_.findIndex(result, { key })];
      BookUtil.fetchBook(key, false, book.path).then((result) => {
        this.props.handleReadingBook(book);
        this.props.handleReadingEpub(window.ePub(result, {}));
        this.props.handleReadingState(true);
        RecentBooks.setRecent(key);
        document.title = book.name + " - Koodo Reader";
      });
    });
  }

  render() {
    if (!this.props.isReading) {
      return (
        <div className="spinner">
          <Lottie options={siriOptions} height={100} width={300} />
        </div>
      );
    }
    return (
      <>
        <Toaster />
        <Reader />
      </>
    );
  }
}
export default withRouter(EpubReader);
