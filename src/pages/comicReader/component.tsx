import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/fileUtils/bookUtil";
import "./viewer.css";
import untar from "js-untar";
import StorageUtil from "../../utils/storageUtil";
import { toast } from "react-hot-toast";
import BackToMain from "../../components/backToMain";

declare var window: any;
const { ComicRender } = window.Kookit;

let JSZip = window.JSZip;
let Unrar = window.Unrar;

class Viewer extends React.Component<ViewerProps, ViewerState> {
  epub: any;
  lock: boolean;

  constructor(props: ViewerProps) {
    super(props);
    this.state = {
      key: "",
      comicScale: StorageUtil.getReaderConfig("comicScale") || "100%",
      readerMode: StorageUtil.getReaderConfig("readerMode") || "double",
      scale: StorageUtil.getReaderConfig("scale") || 1,
      margin: parseInt(StorageUtil.getReaderConfig("margin")) || 30,
    };
    this.lock = false;
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
          StorageUtil.getReaderConfig("comicScale") || "100%"
        )
      ].setAttribute("selected", "selected");
    // window.frames[0].document.addEventListener("wheel", (event) => {
    //   this.handleRecord();
    // });
  }

  handleRender = (key: string) => {
    localforage.getItem("books").then((result: any) => {
      let book;
      //兼容在主窗口打开
      if (this.props.currentBook.key) {
        book = this.props.currentBook;
      } else {
        book =
          result[_.findIndex(result, { key })] ||
          JSON.parse(localStorage.getItem("tempBook") || "{}");
      }
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

  handleCbz = (result: ArrayBuffer) => {
    let zip = new JSZip();
    zip.loadAsync(result).then(async (contents) => {
      let rendition = new ComicRender(
        Object.keys(contents.files).sort(),
        async (data: any) => {
          await zip.file(data).async("arraybuffer");
        },
        this.state.readerMode
      );
      await rendition.renderTo(
        document.getElementsByClassName("html-viewer-page")[0]
      );
    });
  };
  handleCbr = async (result: ArrayBuffer) => {
    let unrar = new Unrar(result);
    var entries = unrar.getEntries();

    let rendition = new ComicRender(
      entries.map((item: any) => item.name),
      unrar,
      this.state.readerMode
    );
    await rendition.renderTo(
      document.getElementsByClassName("html-viewer-page")[0]
    );
  };
  handleCbt = (result: ArrayBuffer) => {
    untar(result).then(
      async (extractedFiles) => {
        let rendition = new ComicRender(
          extractedFiles.map((item: any) => item.name),
          (name: string) =>
            extractedFiles[_.findLastIndex(extractedFiles, { name })].buffer,
          this.state.readerMode
        );
        await rendition.renderTo(
          document.getElementsByClassName("html-viewer-page")[0]
        );
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
        <div
          className="html-viewer-page"
          style={
            document.body.clientWidth < 570
              ? { left: 0, right: 0 }
              : this.state.readerMode === "scroll"
              ? {
                  left: `calc(50vw - ${
                    270 * parseFloat(this.state.scale)
                  }px + 9px)`,
                  right: `calc(50vw - ${
                    270 * parseFloat(this.state.scale)
                  }px + 7px)`,
                  overflowY: "scroll",
                  overflowX: "hidden",
                }
              : this.state.readerMode === "single"
              ? {
                  left: `calc(50vw - ${
                    270 * parseFloat(this.state.scale)
                  }px + 15px)`,
                  right: `calc(50vw - ${
                    270 * parseFloat(this.state.scale)
                  }px + 15px)`,
                }
              : this.state.readerMode === "double"
              ? {
                  left: this.state.margin + 10 + "px",
                  right: this.state.margin + 10 + "px",
                }
              : {}
          }
        ></div>
        <BackToMain />
      </>
    );
  }
}
export default withRouter(Viewer as any);
