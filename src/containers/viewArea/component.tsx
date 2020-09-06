import React from "react";
import "./viewArea.css";
import PopupMenu from "../popupMenu";
import { ViewAreaProps, ViewAreaStates } from "./interface";
import RecordLocation from "../../utils/recordLocation";
import { MouseEvent } from "../../utils/mouseEvent";
import OtherUtil from "../../utils/otherUtil";
import BookmarkModel from "../../model/Bookmark";
import ReaderConfig from "../../utils/readerConfig";
import { Trans } from "react-i18next";

declare var window: any;

class ViewArea extends React.Component<ViewAreaProps, ViewAreaStates> {
  rendition: any;
  isFirst: boolean;
  constructor(props: ViewAreaProps) {
    super(props);
    this.state = {
      isShowImage: false,
      imageRatio: "horizontal",
      isSingle: OtherUtil.getReaderConfig("isSingle") === "single",
      isScroll: OtherUtil.getReaderConfig("isScroll") === "yes",
      cfiRange: null,
      contents: null,
      rendition: null,
      rect: null,
      loading: true,
    };
    this.rendition = null;
    this.isFirst = true;
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchLocations(this.props.currentEpub);
  }

  componentDidMount() {
    let page = document.querySelector("#page-area");
    let epub = this.props.currentEpub;
    (window as any).rangy.init(); // 初始化
    this.rendition = epub.renderTo(page, {
      manager:
        this.state.isSingle && this.state.isScroll ? "continuous" : "default",
      flow: this.state.isScroll ? "scrolled" : "auto",
      width: "100%",
      height: "100%",
    });
    this.setState({ rendition: this.rendition });
    !this.state.isScroll && MouseEvent(this.rendition); // 绑定事件
    this.rendition.on("locationChanged", () => {
      this.props.handleReadingEpub(epub);
      this.props.handleOpenMenu(false);
      const currentLocation = this.rendition.currentLocation();
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
    this.rendition.on("rendered", () => {
      this.setState({ loading: false });
      let iframe = document.getElementsByTagName("iframe")[0];
      if (!iframe) return;
      let doc = iframe.contentDocument;
      if (!doc) {
        return;
      }
      ReaderConfig.addDefaultCss();
      doc.addEventListener("click", this.showImage);
    });
    this.rendition.on("selected", (cfiRange: any, contents: any) => {
      var range = contents.range(cfiRange);
      var rect = range.getBoundingClientRect();
      console.log("selected");
      this.setState({ cfiRange, contents, rect });
    });
    this.rendition.themes.default({
      "a, article, cite, code, div, li, p, pre, span, table": {
        "font-size": `${
          OtherUtil.getReaderConfig("fontSize") || 17
        }px !important`,
        "line-height": `${
          OtherUtil.getReaderConfig("lineHeight") || "1.25"
        } !important`,
        "font-family": `${
          OtherUtil.getReaderConfig("fontFamily") || "Helvetica"
        } !important`,
      },
    });
    this.rendition.display(
      RecordLocation.getCfi(this.props.currentBook.key) === null
        ? null
        : RecordLocation.getCfi(this.props.currentBook.key).cfi
    );
  }
  showImage = (event: any) => {
    console.log("click");
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
  render() {
    const popupMenuProps = {
      rendition: this.state.rendition,
      cfiRange: this.state.cfiRange,
      contents: this.state.contents,
      rect: this.state.rect,
    };
    return (
      <div className="view-area">
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
        {this.rendition && <PopupMenu {...popupMenuProps} />}
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
            <div style={{ marginTop: "10px" }}>
              <Trans>Loading</Trans>
            </div>
          </div>
        ) : null}
        <>
          <div
            className="view-area-page"
            id="page-area"
            style={
              this.state.isSingle && this.state.isScroll
                ? {
                    left: "calc(50vw - 270px)",
                    right: "calc(50vw - 270px)",
                    top: "50px",
                    bottom: "50px",
                  }
                : this.state.isSingle
                ? { left: "calc(50vw - 270px)", right: "calc(50vw - 270px)" }
                : {}
            }
          ></div>
          {this.props.isShowBookmark ? <div className="bookmark"></div> : null}
        </>
      </div>
    );
  }
}

export default ViewArea;
