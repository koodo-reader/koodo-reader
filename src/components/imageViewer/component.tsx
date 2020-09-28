//阅读器图书内容区域
import React from "react";
import "./imageViewer.css";
import { ImageViewerProps, ImageViewerStates } from "./interface";
import ReaderConfig from "../../utils/readerConfig";
const isElectron = require("is-electron");

declare var window: any;

class ImageViewer extends React.Component<ImageViewerProps, ImageViewerStates> {
  constructor(props: ImageViewerProps) {
    super(props);
    this.state = {
      isShowImage: false,
      imageRatio: "horizontal",
      zoomIndex: 1,
    };
  }

  componentDidMount() {
    this.props.rendition.on("rendered", () => {
      let iframe = document.getElementsByTagName("iframe")[0];
      if (!iframe) return;
      let doc = iframe.contentDocument;
      if (!doc) {
        return;
      }
      ReaderConfig.addDefaultCss();
      doc.addEventListener("click", this.showImage);
    });
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
  handleZoomIn = () => {
    this.setState({ zoomIndex: 1.1 * this.state.zoomIndex }, () => {
      let image: any = document.querySelector(".image");
      image!.setAttribute("style", `width`);
    });
  };
  render() {
    return (
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
        <div>
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
          <div className="image-operation">
            <span
              className="icon-zoom-in zoom-in-icon"
              onClick={() => {
                this.handleZoomIn();
              }}
            ></span>
            <span
              className="icon-zoom-out zoom-out-icon"
              onClick={() => {
                // this.handleZoomOut();
              }}
            ></span>
            <span
              className="icon-save save-icon"
              onClick={() => {
                // this.handleSave();
              }}
            ></span>
            <span
              className="icon-clockwise clockwise-icon"
              onClick={() => {
                // this.handleClock();
              }}
            ></span>
            <span
              className="icon-counterclockwise counterclockwise-icon"
              onClick={() => {
                // this.handleCounterClock();
              }}
            ></span>
          </div>
        </div>
      </div>
    );
  }
}

export default ImageViewer;
