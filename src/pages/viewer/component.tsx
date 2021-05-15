//卡片模式下的图书显示
import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/bookUtil";
import Lottie from "react-lottie";
import animationSiri from "../../assets/lotties/siri.json";
import MobiParser from "../../utils/mobiParser";
import "./viewer.css";

const siriOptions = {
  loop: true,
  autoplay: true,
  animationData: animationSiri,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};

class Viewer extends React.Component<ViewerProps, ViewerState> {
  epub: any;
  constructor(props: ViewerProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    let url = document.location.href.split("/");
    let key = url[url.length - 1].split("?")[0];

    localforage.getItem("books").then((result: any) => {
      let book = result[_.findIndex(result, { key })];
      BookUtil.fetchBook(key, true).then((result) => {
        this.props.handleReadingBook(book);
        if (book.format === "MOBI" || book.format === "AZW3") {
          this.handleMobi(result as ArrayBuffer);
        } else if (book.format === "TXT") {
          this.handleTxt(result as ArrayBuffer);
        }
        this.props.handleReadingState(true);
        RecentBooks.setRecent(key);
      });
    });
  }
  handleMobi = async (result: ArrayBuffer) => {
    let mobiFile = new MobiParser(result);
    let content: any = await mobiFile.render();
    let viewer: HTMLElement | null = document.querySelector(".ebook-viewer");
    if (!viewer?.innerHTML) return;
    viewer.innerHTML = content.outerHTML;
  };
  handleTxt = async (result: ArrayBuffer) => {
    var blob = new Blob([result], { type: "text/plain" });
    var reader = new FileReader();
    reader.onload = function (evt) {
      let viewer: HTMLElement | null = document.querySelector(".ebook-viewer");
      console.log(evt.target?.result, viewer, document);
      if (!viewer?.innerText) return;
      viewer.innerText = evt.target?.result as any;
    };
    reader.readAsText(blob, "UTF-8");
  };
  render() {
    if (!this.props.isReading) {
      return (
        <div className="spinner">
          <Lottie options={siriOptions} height={100} width={300} />
        </div>
      );
    }
    return <div className="ebook-viewer">Loading</div>;
  }
}
export default withRouter(Viewer as any);
