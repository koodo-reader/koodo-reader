import React from "react";
import "./imageViewer.css";
import { ImageViewerProps, ImageViewerStates } from "./interface";
import { saveAs } from "file-saver";
import { getIframeDoc } from "../../utils/reader/docUtil";
declare var window: any;
class ImageViewer extends React.Component<ImageViewerProps, ImageViewerStates> {
  constructor(props: ImageViewerProps) {
    super(props);
    this.state = {
      isShowImage: false,
      imageRatio: "horizontal",
      imageName: "",
      zoomIndex: 0,
      rotateIndex: 0,
    };
  }

  componentDidMount() {
    this.props.rendition.on("rendered", () => {
      let docs = getIframeDoc(this.props.currentBook.format);
      for (let i = 0; i < docs.length; i++) {
        let doc = docs[i];
        if (!doc) continue;
        doc.addEventListener("click", this.showImage);
      }
    });
  }

  showImage = async (event: any) => {
    event.preventDefault();
    if (this.props.isShow) {
      this.props.handleLeaveReader("left");
      this.props.handleLeaveReader("right");
      this.props.handleLeaveReader("top");
      this.props.handleLeaveReader("bottom");
    }

    let href = this.props.rendition.getTargetHref(event);
    if (
      href &&
      (this.props.rendition.resolveChapter(href) ||
        href.indexOf("#") > -1 ||
        href.indexOf("../") === 0 ||
        href.indexOf("http") === 0 ||
        href.indexOf("mailto") === 0 ||
        href.indexOf("OEBPF") > -1 ||
        href.indexOf("kindle:") > -1 ||
        href.indexOf("footnote") > -1)
    ) {
      return;
    }
    if (
      event.target.tagName === "IMG" &&
      event.target.getAttribute("alt") &&
      ((event.target.getAttribute("class") &&
        event.target.getAttribute("class").indexOf("footnote") > -1) ||
        (event.target.getAttribute("id") &&
          event.target.getAttribute("id").indexOf("footnote") > -1))
    ) {
      window.vex.dialog.alert(event.target.getAttribute("alt"));
      return;
    }
    if (event.target.tagName === "IMG" && event.target.src) {
      href = event.target.src;
    }
    if (
      event.target.tagName === "image" &&
      event.target.getAttribute("xlink:href")
    ) {
      href = event.target.getAttribute("xlink:href");
    }
    if (event.target.tagName === "IMG" && event.target.getAttribute("alt")) {
      this.setState({ imageName: event.target.getAttribute("alt") });
    }
    if (!href) {
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
    img.src = href;
    let image: HTMLImageElement | null =
      document.querySelector("#selectedImage");
    if (image) {
      image!.src = href;
      this.setState({ isShowImage: true });
      if (this.state.imageRatio === "horizontal") {
        image.style.width = "60vw";
      } else {
        image.style.height = "100vh";
      }
    }
  };
  hideImage = (event: any) => {
    event.preventDefault();
    let image: HTMLImageElement | null =
      document.querySelector("#selectedImage");
    if (image) {
      image.src = "";
      image.style.removeProperty("margin-top");
      image.style.removeProperty("transform");
      image.style.removeProperty("width");
      image.style.removeProperty("height");
    }

    this.setState({ isShowImage: false });
  };
  handleZoomIn = () => {
    let image: any = document.querySelector("#selectedImage");
    if (image.style.width === "200vw" || image.style.height === "200vh") return;
    this.setState({ zoomIndex: this.state.zoomIndex + 1 }, () => {
      if (this.state.imageRatio === "horizontal") {
        image.style.width = `${60 + this.state.zoomIndex * 10}vw`;
        // image.style.marginTop = `${10 * this.state.zoomIndex}vh`;
      } else {
        image.style.height = `${100 + 10 * this.state.zoomIndex}vh`;
      }
    });
  };
  handleZoomOut = () => {
    let image: any = document.querySelector("#selectedImage");
    if (image.style.width === "10vw" || image.style.height === "10vh") return;
    this.setState({ zoomIndex: this.state.zoomIndex - 1 }, () => {
      if (this.state.imageRatio === "horizontal") {
        image.style.width = `${60 + this.state.zoomIndex * 10}vw`;
      } else {
        image.style.height = `${100 + 10 * this.state.zoomIndex}vh`;
      }
    });
  };
  handleSave = async () => {
    let image: any = document.querySelector("#selectedImage");
    let blob = await fetch(image.src).then((r) => r.blob());
    saveAs(
      blob,
      this.state.imageName
        ? this.state.imageName
        : `${new Date().toLocaleDateString()}`
    );
  };
  handleClock = () => {
    let image: any = document.querySelector("#selectedImage");
    this.setState({ rotateIndex: this.state.rotateIndex + 1 }, () => {
      image.style.transform = `rotate(${this.state.rotateIndex * 90}deg)`;
    });
  };
  handleCounterClock = () => {
    let image: any = document.querySelector("#selectedImage");
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
          alt={this.state.imageName}
          className="image"
          id="selectedImage"
          style={
            this.state.imageRatio === "horizontal"
              ? { width: "60vw" }
              : { height: "100vh" }
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
