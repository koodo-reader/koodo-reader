//卡片模式下的图书显示
import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { DjvuReaderProps, DjvuReaderState } from "./interface";
import localforage from "localforage";

import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/bookUtil";
import Lottie from "react-lottie";
import animationSiri from "../../assets/lotties/siri.json";

const siriOptions = {
  loop: true,
  autoplay: true,
  animationData: animationSiri,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};
declare var window: any;

class DjvuReader extends React.Component<DjvuReaderProps, DjvuReaderState> {
  epub: any;
  constructor(props: DjvuReaderProps) {
    super(props);
    this.state = {};
  }

  componentWillMount() {
    let url = document.location.href.split("/");
    let key = url[url.length - 1].split("?")[0];

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
          <Lottie options={siriOptions} height={100} width={300} />
        </div>
      );
    }
    return <div className="djvu-viewer"></div>;
  }
}
export default withRouter(DjvuReader as any);
