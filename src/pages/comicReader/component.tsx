import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/fileUtils/bookUtil";
import "./viewer.css";
import untar from "js-untar";
import OtherUtil from "../../utils/otherUtil";
import { mimetype } from "../../constants/mimetype";
import RecordLocation from "../../utils/readUtils/recordLocation";
import { isElectron } from "react-device-detect";
import { toast } from "react-hot-toast";

declare var window: any;

let JSZip = window.JSZip;
let Unrar = window.Unrar;

class Viewer extends React.Component<ViewerProps, ViewerState> {
  epub: any;
  constructor(props: ViewerProps) {
    super(props);
    this.state = {
      key: "",
      comicScale: OtherUtil.getReaderConfig("comicScale") || "100%",
    };
  }

  componentDidMount() {
    let url = document.location.href.split("/");
    let key = url[url.length - 1].split("?")[0];
    this.setState({ key });
    this.handleRender(key);
    document
      .getElementsByClassName("lang-setting-dropdown")[0]
      ?.children[
        ["25%", "50%", "75%", "100%"].indexOf(
          OtherUtil.getReaderConfig("comicScale") || "100%"
        )
      ].setAttribute("selected", "selected");
    window.frames[0].document.addEventListener("wheel", (event) => {
      RecordLocation.recordScrollHeight(
        key,
        document.body.clientWidth,
        document.body.clientHeight,
        window.frames[0].document.scrollingElement!.scrollTop,
        window.frames[0].document.scrollingElement!.scrollHeight
      );
    });
    window.onbeforeunload = () => {
      this.handleExit(key);
    };
  }
  handleRender = (key: string) => {
    localforage.getItem("books").then((result: any) => {
      let book = result[_.findIndex(result, { key })];
      BookUtil.fetchBook(key, true, book.path).then((result) => {
        if (!result) {
          toast.error(this.props.t("Book not exsits"));
          return;
        }
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
        document.title = book.name + " - Koodo Reader";
      });
    });
  };
  // 点击退出按钮的处理程序
  handleExit(key: string) {
    this.props.handleReadingState(false);

    if (isElectron) {
      const { remote } = window.require("electron");
      let bounds = remote.getCurrentWindow().getBounds();
      OtherUtil.setReaderConfig("windowWidth", bounds.width);
      OtherUtil.setReaderConfig("windowHeight", bounds.height);
      OtherUtil.setReaderConfig("windowX", bounds.x);
      OtherUtil.setReaderConfig("windowY", bounds.y);
    }
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
    imageDom.setAttribute(
      "style",
      `width:${OtherUtil.getReaderConfig("comicScale") || "100%"};margin-left:${
        OtherUtil.getReaderConfig("comicScale") === "75%" ? "12.5%" : "0%"
      }`
    );
    window.frames[0].document.body.appendChild(imageDom);
    let loading = window.frames[0].document.querySelector("p");
    if (!loading) return;
    window.frames[0].document.body.removeChild(loading);
  };
  handleJump = () => {
    window.frames[0].document.scrollingElement!.scrollTo(
      0,
      RecordLocation.getScrollHeight(this.state.key).scroll
    );
  };
  handleCbz = (result: ArrayBuffer) => {
    let zip = new JSZip();
    zip.loadAsync(result).then(async (contents) => {
      for (let filename of Object.keys(contents.files).sort()) {
        const content = await zip.file(filename).async("arraybuffer");
        const extension = filename.split(".").reverse()[0];
        this.addImage(content, extension);
      }
      this.handleJump();
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
      <>
        <iframe
          className="ebook-viewer"
          title="html-viewer"
          width="100%"
          height="100%"
        >
          <p>Loading</p>
        </iframe>
        <div className="comic-scale">
          <select
            name=""
            className="lang-setting-dropdown"
            id="text-speech-voice"
            onChange={(event) => {
              OtherUtil.setReaderConfig("comicScale", event.target.value);
              window.frames[0].document.body.innerHTML = "";
              this.handleRender(this.state.key);
            }}
          >
            {["25%", "50%", "75%", "100%"].map((item, index) => {
              return (
                <option value={item} className="lang-setting-option">
                  {item}
                </option>
              );
            })}
          </select>
        </div>
      </>
    );
  }
}
export default withRouter(Viewer as any);
