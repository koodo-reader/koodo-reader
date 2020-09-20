import React from "react";
import "./viewArea.css";
import PopupMenu from "../popupMenu";
import { ViewAreaProps, ViewAreaStates } from "./interface";
import RecordLocation from "../../utils/recordLocation";
import OtherUtil from "../../utils/otherUtil";
import BookmarkModel from "../../model/Bookmark";
import ReaderConfig from "../../utils/readerConfig";
const isElectron = require("is-electron");

declare var window: any;

let Hammer = window.Hammer;

class ViewArea extends React.Component<ViewAreaProps, ViewAreaStates> {
  isFirst: boolean;
  constructor(props: ViewAreaProps) {
    super(props);
    this.state = {
      isShowImage: false,
      imageRatio: "horizontal",
      cfiRange: null,
      contents: null,
      rect: null,
      loading: true,
    };
    this.isFirst = true;
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchLocations(this.props.currentEpub);
  }

  componentDidMount() {
    let epub = this.props.currentEpub;
    (window as any).rangy.init(); // 初始化
    this.props.rendition.on("locationChanged", () => {
      this.props.handleReadingEpub(epub);
      this.props.handleOpenMenu(false);
      const currentLocation = this.props.rendition.currentLocation();
      const cfi = currentLocation.start.cfi;
      this.props.handleShowBookmark(
        this.props.bookmarks &&
          this.props.bookmarks.filter(
            (item: BookmarkModel) => item.cfi === cfi
          )[0]
          ? true
          : false
      );
      if (!this.isFirst && this.props.locations) {
        let percentage = this.props.locations.percentageFromCfi(cfi);
        RecordLocation.recordCfi(this.props.currentBook.key, cfi, percentage);
        this.props.handlePercentage(percentage);
      }
      this.isFirst = false;
    });
    this.props.rendition.on("rendered", () => {
      this.setState({ loading: false });
      let iframe = document.getElementsByTagName("iframe")[0];
      if (!iframe) return;
      let doc = iframe.contentDocument;
      if (!doc) {
        return;
      }
      ReaderConfig.addDefaultCss();
      if (OtherUtil.getReaderConfig("isTouch") === "yes") {
        const mc = new Hammer(doc);
        mc.on("panleft panright panup pandown", (event: any) => {
          const mc = new Hammer(doc);
          mc.on("tap", (event: any) => {
            if (this.props.isShow) {
              this.props.handleLeaveReader("left");
              this.props.handleLeaveReader("right");
              this.props.handleLeaveReader("top");
              this.props.handleLeaveReader("bottom");
            } else {
              this.props.handleEnterReader("left");
              this.props.handleEnterReader("right");
              this.props.handleEnterReader("top");
              this.props.handleEnterReader("bottom");
            }
          });
        });
      }
      doc.addEventListener("click", this.showImage);
    });
    this.props.rendition.on("selected", (cfiRange: any, contents: any) => {
      var range = contents.range(cfiRange);
      var rect = range.getBoundingClientRect();
      console.log("selected");
      this.setState({ cfiRange, contents, rect });
    });
    this.props.rendition.themes.default({
      "a, article, cite, code, div, li, p, pre, span, table": {
        "font-size": `${
          OtherUtil.getReaderConfig("isUseFont") === "yes"
            ? ""
            : OtherUtil.getReaderConfig("fontSize") || 17
        }px !important`,
        "line-height": `${
          OtherUtil.getReaderConfig("isUseFont") === "yes"
            ? ""
            : OtherUtil.getReaderConfig("lineHeight") || "1.25"
        } !important`,
        "font-family": `${
          OtherUtil.getReaderConfig("isUseFont") === "yes"
            ? ""
            : OtherUtil.getReaderConfig("fontFamily") || "Helvetica"
        } !important`,
        color: `${
          OtherUtil.getReaderConfig("theme") === "rgba(44,47,49,1)"
            ? "white"
            : ""
        } !important`,
      },
    });
    this.props.rendition.display(
      RecordLocation.getCfi(this.props.currentBook.key) === null
        ? null
        : RecordLocation.getCfi(this.props.currentBook.key).cfi
    );
  }
  showImage = (event: any) => {
    console.log("click");
    if (this.props.isShow) {
      this.props.handleLeaveReader("left");
      this.props.handleLeaveReader("right");
      this.props.handleLeaveReader("top");
      this.props.handleLeaveReader("bottom");
    }
    if (
      isElectron() &&
      event.target.parentNode.parentNode.tagName.toLowerCase() === "a"
    ) {
      event.preventDefault();
      window
        .require("electron")
        .shell.openExternal(event.target.parentNode.parentNode.href);
    }
    if (!event.target.src) {
      return;
    }
    if (this.state.isShowImage) {
      this.setState({ isShowImage: false });
    }
    event.preventDefault();
    const handleDirection = (direction: string) => {
      this.setState({ imageRatio: direction });
    };
    var img = new Image();
    img.addEventListener("load", function () {
      handleDirection(
        this.naturalWidth / this.naturalHeight > 1 ? "horizontal" : "vertical"
      );
    });
    img.src = event.target.src;
    let image: HTMLImageElement | null = document.querySelector(".image");
    if (image) {
      image.src = event.target.src;
      this.setState({ isShowImage: true });
    }
  };
  hideImage = (event: any) => {
    event.preventDefault();
    if (event.target.src) {
      let image: HTMLImageElement | null = document.querySelector(".image");
      if (image) image.src = "";
    }
    this.setState({ isShowImage: false });
  };
  previourChapter = () => {
    const currentLocation = this.props.rendition.currentLocation();
    let chapterIndex = currentLocation.start.index;
    const section = this.props.currentEpub.section(chapterIndex - 1);
    if (section && section.href) {
      this.props.currentEpub.rendition.display(section.href);
    }
  };
  nextChapter = () => {
    const currentLocation = this.props.rendition.currentLocation();
    let chapterIndex = currentLocation.start.index;
    const section = this.props.currentEpub.section(chapterIndex + 1);
    if (section && section.href) {
      this.props.currentEpub.rendition.display(section.href);
    }
  };
  render() {
    const popupMenuProps = {
      rendition: this.props.rendition,
      cfiRange: this.state.cfiRange,
      contents: this.state.contents,
      rect: this.state.rect,
    };
    return (
      <div className="view-area">
        {(OtherUtil.getReaderConfig("readerMode") === "single" ||
          OtherUtil.getReaderConfig("readerMode") === "scroll") &&
          this.props.locations && (
            <>
              <div
                className="previous-chapter-single-container"
                onClick={() => {
                  this.previourChapter();
                }}
              >
                <span className="icon-dropdown previous-chapter-single"> </span>
              </div>
              <div
                className="next-chapter-single-container"
                onClick={() => {
                  this.nextChapter();
                }}
              >
                <span className="icon-dropdown next-chapter-single"></span>
              </div>
            </>
          )}
        <div
          className="image-preview"
          style={
            this.state.isShowImage
              ? { backgroundColor: "rgba(75,75,75,0.3)" }
              : { display: "none" }
          }
          onClick={(event) => {
            this.hideImage(event);
          }}
        >
          <img
            src=""
            alt=""
            className="image"
            style={
              this.state.imageRatio === "horizontal"
                ? { width: "60vw" }
                : { height: "90vh" }
            }
          />
        </div>
        <PopupMenu {...popupMenuProps} />
        {this.state.loading ? (
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
        ) : null}
        <>
          {this.props.isShowBookmark ? <div className="bookmark"></div> : null}
        </>
      </div>
    );
  }
}

export default ViewArea;
