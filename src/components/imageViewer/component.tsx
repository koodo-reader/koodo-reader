//阅读器图书内容区域
import React from "react";
import "./imageViewer.css";
import { ImageViewerProps, ImageViewerStates } from "./interface";
import StyleUtil from "../../utils/readUtils/styleUtil";
import FileSaver from "file-saver";

const isElectron = require("is-electron");

declare var window: any;

class ImageViewer extends React.Component<ImageViewerProps, ImageViewerStates> {
  constructor(props: ImageViewerProps) {
    super(props);
    this.state = {
      isShowImage: false,
      imageRatio: "horizontal",
      zoomIndex: 0,
      rotateIndex: 0,
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
      StyleUtil.addDefaultCss();
      doc.addEventListener("click", this.showImage, false);
    });
  }

  showImage = (event: any) => {
    if (this.props.isShow) {
      this.props.handleLeaveReader("left");
      this.props.handleLeaveReader("right");
      this.props.handleLeaveReader("top");
      this.props.handleLeaveReader("bottom");
    }
    let href =
      event.target.src ||
      event.target.href ||
      event.target.parentNode.href ||
      event.target.parentNode.parentNode.href ||
      "";
    if (
      isElectron() &&
      href &&
      href.indexOf("OEBPF") === -1 &&
      href.indexOf("OEBPS") === -1 &&
      href.indexOf("footnote") === -1 &&
      href.indexOf("blob") === -1 &&
      href.indexOf(".htm") === -1
    ) {
      console.log(href);
      event.preventDefault();
      const { shell } = window.require("electron");
      const { dialog } = window.require("electron").remote;
      dialog
        .showMessageBox({
          type: "question",
          title: this.props.t("Open link in browser"),
          message: this.props.t("Do you want to open this link in browser"),
          buttons: [this.props.t("Confirm"), this.props.t("Cancel")],
        })
        .then((result) => {
          result.response === 0 && shell.openExternal(href);
        });
    }
    if (!event.target.src) {
      return;
    }
    if (this.state.isShowImage) {
      this.setState({
        isShowImage: false,
        zoomIndex: 0,
        rotateIndex: 0,
        imageRatio: "horizontal",
      });
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
    let image: any = document.querySelector(".image");
    if (image.style.width === "200vw" || image.style.height === "200vh") return;
    this.setState({ zoomIndex: this.state.zoomIndex + 1 }, () => {
      if (this.state.imageRatio === "horizontal") {
        image.style.width = `${60 + this.state.zoomIndex * 10}vw`;
      } else {
        image.style.height = `${90 + 10 * this.state.zoomIndex}vh`;
      }
    });
  };
  handleZoomOut = () => {
    let image: any = document.querySelector(".image");
    if (image.style.width === "10vw" || image.style.height === "10vh") return;
    this.setState({ zoomIndex: this.state.zoomIndex - 1 }, () => {
      if (this.state.imageRatio === "horizontal") {
        image.style.width = `${60 + this.state.zoomIndex * 10}vw`;
      } else {
        image.style.height = `${90 + 10 * this.state.zoomIndex}vh`;
      }
    });
  };
  handleSave = async () => {
    let image: any = document.querySelector(".image");
    let blob = await fetch(image.src).then((r) => r.blob());
    FileSaver.saveAs(blob, `${new Date().toLocaleDateString()}`);
  };
  handleClock = () => {
    let image: any = document.querySelector(".image");
    this.setState({ rotateIndex: this.state.rotateIndex + 1 }, () => {
      image.style.transform = `rotate(${this.state.rotateIndex * 90}deg)`;
    });
  };
  handleCounterClock = () => {
    let image: any = document.querySelector(".image");
    this.setState({ rotateIndex: this.state.rotateIndex - 1 }, () => {
      image.style.transform = `rotate(${this.state.rotateIndex * 90}deg)`;
    });
  };
  render() {
    return (
      <div
        className="image-preview"
        style={this.state.isShowImage ? {} : { display: "none" }}
      >
        <div
          className="image-background"
          style={
            this.state.isShowImage
              ? { backgroundColor: "rgba(75,75,75,0.3)" }
              : {}
          }
          onClick={(event) => {
            this.hideImage(event);
          }}
        ></div>
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
              this.handleZoomOut();
            }}
          ></span>
          <span
            className="icon-save save-icon"
            onClick={() => {
              this.handleSave();
            }}
          ></span>
          <span
            className="icon-clockwise clockwise-icon"
            onClick={() => {
              this.handleClock();
            }}
          ></span>
          <span
            className="icon-counterclockwise counterclockwise-icon"
            onClick={() => {
              this.handleCounterClock();
            }}
          ></span>
        </div>
      </div>
    );
  }
}

export default ImageViewer;
