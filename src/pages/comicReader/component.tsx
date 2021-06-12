//卡片模式下的图书显示
import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/bookUtil";
import "./viewer.css";
import untar from "js-untar";
import OtherUtil from "../../utils/otherUtil";
import { mimetype } from "../../constants/mimetype";
import RecordLocation from "../../utils/readUtils/recordLocation";

declare var window: any;

let JSZip = window.JSZip;
let Unrar = window.Unrar;

class Viewer extends React.Component<ViewerProps, ViewerState> {
  epub: any;
  constructor(props: ViewerProps) {
    super(props);
    this.state = { key: "" };
  }

  componentDidMount() {
    let url = document.location.href.split("/");
    let key = url[url.length - 1].split("?")[0];
    this.setState({ key });
    localforage.getItem("books").then((result: any) => {
      let book = result[_.findIndex(result, { key })];
      BookUtil.fetchBook(key, true).then((result) => {
        this.props.handleReadingBook(book);
        if (book.format === "CBR") {
          this.handleCbr(result as ArrayBuffer);
        } else if (book.format === "CBZ") {
          this.handleCbz(result as ArrayBuffer);
        } else if (book.format === "CBT") {
          this.handleCbt(result as ArrayBuffer);
        }
        this.props.handleReadingState(true);
        RecentBooks.setRecent(key);
      });
    });
    document.documentElement.style.height = "auto";
    document.documentElement.style.overflow = "auto";
    window.addEventListener("wheel", (event) => {
      RecordLocation.recordScrollHeight(
        key,
        document.body.clientWidth,
        document.body.clientHeight,
        document.scrollingElement!.scrollTop
      );
    });
    window.onbeforeunload = () => {
      this.handleExit(key);
    };
  }
  // 点击退出按钮的处理程序
  handleExit(key: string) {
    this.props.handleReadingState(false);

    OtherUtil.setReaderConfig("windowWidth", document.body.clientWidth + "");
    OtherUtil.setReaderConfig("windowHeight", document.body.clientHeight + "");
    OtherUtil.setReaderConfig("windowX", window.screenX + "");
    OtherUtil.setReaderConfig("windowY", window.screenY + "");
  }
  base64ArrayBuffer = (arrayBuffer) => {
    var base64 = "";
    var encodings =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var bytes = new Uint8Array(arrayBuffer);
    var byteLength = bytes.byteLength;
    var byteRemainder = byteLength % 3;
    var mainLength = byteLength - byteRemainder;
    var a, b, c, d;
    var chunk;
    for (var i = 0; i < mainLength; i = i + 3) {
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
      a = (chunk & 16515072) >> 18;
      b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
      c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
      d = chunk & 63; // 63       = 2^6 - 1
      base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }

    if (byteRemainder === 1) {
      chunk = bytes[mainLength];

      a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
      b = (chunk & 3) << 4; // 3   = 2^2 - 1
      base64 += encodings[a] + encodings[b] + "==";
    } else if (byteRemainder === 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
      a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
      b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4
      c = (chunk & 15) << 2; // 15    = 2^4 - 1
      base64 += encodings[a] + encodings[b] + encodings[c] + "=";
    }

    return base64;
  };
  addImage = (content: ArrayBuffer, extension: string) => {
    let url = this.base64ArrayBuffer(content);

    let imageDom = document.createElement("img");
    imageDom.src =
      "data:" + mimetype[extension.toLowerCase()] + ";base64," + url;
    imageDom.setAttribute("style", "width: 100%");
    let viewer: HTMLElement | null = document.querySelector(".ebook-viewer");
    if (!viewer?.innerHTML) return;
    viewer.appendChild(imageDom);
    let loading = document.querySelector("p");
    if (!loading) return;
    viewer.removeChild(loading);
  };
  handleCbz = (result: ArrayBuffer) => {
    let zip = new JSZip();
    zip.loadAsync(result).then(async (contents) => {
      for (let filename of Object.keys(contents.files).sort()) {
        const content = await zip.file(filename).async("arraybuffer");
        const extension = filename.split(".").reverse()[0];
        this.addImage(content, extension);
      }

      document.scrollingElement!.scrollTo(
        0,
        RecordLocation.getScrollHeight(this.state.key).scroll
      );
    });
  };
  handleCbr = (result: ArrayBuffer) => {
    let unrar = new Unrar(result);
    var entries = unrar.getEntries();
    for (let item of entries) {
      var fileData = unrar.decompress(item.name);
      if (!fileData) {
        console.log("decompress failed...");
      }
      const extension = item.name.split(".").reverse()[0];
      this.addImage(fileData, extension);
    }
    document.scrollingElement!.scrollTo(
      0,
      RecordLocation.getScrollHeight(this.state.key).scroll
    );
  };
  handleCbt = (result: ArrayBuffer) => {
    untar(result).then(
      (extractedFiles) => {
        for (let item of extractedFiles) {
          const extension = item.name.split(".").reverse()[0];
          this.addImage(item.buffer, extension);
        }
        document.scrollingElement!.scrollTo(
          0,
          RecordLocation.getScrollHeight(this.state.key).scroll
        );
        // onSuccess
      },
      function (err) {
        // onError
      },
      function (extractedFile) {
        // onProgress
      }
    );
  };
  render() {
    return (
      <div className="ebook-viewer">
        <p>Loading</p>
      </div>
    );
  }
}
export default withRouter(Viewer as any);
