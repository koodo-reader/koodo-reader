import React from "react";
import "./viewArea.css";
import PopupMenu from "../popupMenu";
import { ViewAreaProps, ViewAreaStates } from "./interface";
import RecordLocation from "../../utils/recordLocation";
import { MouseEvent } from "../../utils/mouseEvent";
import OtherUtil from "../../utils/otherUtil";
import BookmarkModel from "../../model/Bookmark";

declare var window: any;

class ViewArea extends React.Component<ViewAreaProps, ViewAreaStates> {
  rendition: any;

  constructor(props: ViewAreaProps) {
    super(props);
    this.state = {
      isShowImage: false,
      imageRatio: "horizontal",
      isSingle: OtherUtil.getReaderConfig("isSingle") === "single",
      cfiRange: null,
      contents: null,
      rendition: null,
      rect: null,
    };
    this.rendition = null;
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchLocations(this.props.currentEpub);
  }

  componentDidMount() {
    let page = document.querySelector("#page-area");
    let epub = this.props.currentEpub;
    (window as any).rangy.init(); // 初始化
    this.rendition = epub.renderTo(page, {
      manager: "default",
      flow: "auto",
      width: this.state.isSingle ? "60%" : "100%",
      height: "100%",
    });
    this.setState({ rendition: this.rendition });
    MouseEvent(this.rendition); // 绑定事件
    this.rendition.on("locationChanged", () => {
      this.props.handleReadingEpub(epub);
      this.props.handleOpenMenu(false);
      let cfi = epub.rendition.currentLocation().start.cfi;
      this.props.handleShowBookmark(
        this.props.bookmarks &&
          this.props.bookmarks.filter(
            (item: BookmarkModel) => item.cfi === cfi
          )[0]
          ? true
          : false
      );

      if (this.props.locations) {
        let percentage = this.props.locations.percentageFromCfi(cfi);
        RecordLocation.recordCfi(this.props.currentBook.key, cfi, percentage);
        this.props.handlePercentage(percentage);
      }
    });
    this.rendition.on("rendered", () => {
      let doc = document.getElementsByTagName("iframe")[0].contentDocument;
      doc!.addEventListener("click", this.showImage);
    });
    this.rendition.on("selected", (cfiRange: any, contents: any) => {
      var range = contents.range(cfiRange);
      var rect = range.getBoundingClientRect();
      this.setState({ cfiRange, contents, rect });
    });
    // this.rendition.on("selected", (cfiRange: any, contents: any) => {
    //   var range = contents.range(cfiRange);
    //   console.log(range, "range");
    //   var rect = range.getBoundingClientRect();
    //   console.log(rect);
    // });
    this.rendition.display(
      RecordLocation.getCfi(this.props.currentBook.key) === null
        ? null
        : RecordLocation.getCfi(this.props.currentBook.key).cfi
    );
    document.addEventListener("click", this.showImage);
  }
  showImage = (event: any) => {
    console.log("click");
    if (this.state.isShowImage) {
      this.setState({ isShowImage: false });
    }
    event.preventDefault();
    const handleDirection = (direction: string) => {
      this.setState({ imageRatio: direction });
    };
    if (event.target.src) {
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
        <>
          <div className="view-area-page" id="page-area"></div>
          {this.props.isShowBookmark ? <div className="bookmark"></div> : null}
        </>
      </div>
    );
  }
}

export default ViewArea;
