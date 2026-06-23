import React from "react";
import "./imageViewer.css";
import { ImageViewerProps, ImageViewerStates } from "./interface";
import { saveAs } from "file-saver";
import { getIframeDoc } from "../../utils/reader/docUtil";
import toast from "react-hot-toast";
declare var window: any;
declare var ClipboardItem: any;

const NAV_LOCK_MS = 100;

const isPrevKey = (code: number, readerMode: string) =>
  code === 33 || code === 37 || (code === 38 && readerMode !== "scroll");

const isNextKey = (code: number, readerMode: string) =>
  code === 32 ||
  code === 34 ||
  code === 39 ||
  (code === 40 && readerMode !== "scroll");

const findImageIndex = (href: string, list: string[]) => {
  if (!href || !list.length) return 0;
  const name = href.split("/").pop() || href;
  const index = list.findIndex(
    (url) => url === href || url.split("/").pop() === name
  );
  return index >= 0 ? index : 0;
};

class ImageViewer extends React.Component<ImageViewerProps, ImageViewerStates> {
  lock = false;
  previewRef = React.createRef<HTMLDivElement>();
  imageRef = React.createRef<HTMLImageElement>();

  constructor(props: ImageViewerProps) {
    super(props);
    this.state = {
      isShowImage: false,
      imageRatio: "horizontal",
      imageName: "",
      zoomIndex: 0,
      rotateIndex: 0,
      imageList: [],
      currentIndex: 0,
    };
  }

  componentDidMount() {
    this.bindDocEvents(true);
    this.props.rendition.on("rendered", this.onRendered);
    window.addEventListener("keydown", this.handleKeyDown, true);
  }

  componentWillUnmount() {
    this.props.rendition.off?.("rendered", this.onRendered);
    this.bindDocEvents(false);
    window.removeEventListener("keydown", this.handleKeyDown, true);
  }

  onRendered = () => this.bindDocEvents(true);

  bindDocEvents = (bind: boolean) => {
    const method = bind ? "addEventListener" : "removeEventListener";
    getIframeDoc(this.props.currentBook.format).forEach((doc) => {
      if (!doc) return;
      doc[method]("click", this.showImage);
      doc[method]("keydown", this.handleKeyDown, true);
      doc.defaultView?.[method]("keydown", this.handleKeyDown, true);
    });
  };

  showAt = (index: number, list = this.state.imageList) => {
    if (index < 0 || index >= list.length) return;
    const image = this.imageRef.current;
    if (!image) return;

    image.style.removeProperty("margin-top");
    image.style.removeProperty("transform");
    image.style.removeProperty("width");
    image.style.removeProperty("height");

    const url = list[index];
    const loader = new Image();
    loader.onload = () => {
      const horizontal = loader.naturalWidth / loader.naturalHeight > 1;
      this.setState({
        imageList: list,
        currentIndex: index,
        imageRatio: horizontal ? "horizontal" : "vertical",
        zoomIndex: 0,
        rotateIndex: 0,
      });
      image.style[horizontal ? "width" : "height"] = horizontal
        ? "60vw"
        : "100vh";
    };
    loader.src = url;
    image.src = url;
  };

  loadChapterImages = async (direction: "next" | "prev") => {
    const { rendition } = this.props;
    while (true) {
      const prevHref = rendition.getPosition()?.chapterHref || "";
      await rendition[direction === "next" ? "nextChapter" : "prevChapter"]();
      if ((rendition.getPosition()?.chapterHref || "") === prevHref)
        return null;
      const list = (await rendition.getImageList?.()) || [];
      if (list.length) return list;
    }
  };

  shiftImage = async (step: number) => {
    if (this.lock || !this.state.isShowImage) return;
    this.lock = true;
    try {
      const { imageList, currentIndex } = this.state;
      const next = currentIndex + step;
      if (next >= 0 && next < imageList.length) {
        this.showAt(next);
        return;
      }
      const list = await this.loadChapterImages(step > 0 ? "next" : "prev");
      if (!list) {
        toast(this.props.t("No more images"));
        return;
      }
      this.showAt(step > 0 ? 0 : list.length - 1, list);
    } finally {
      setTimeout(() => (this.lock = false), NAV_LOCK_MS);
    }
  };

  handleKeyDown = async (event: Event) => {
    if (!this.state.isShowImage) return;
    const keyEvent = event as KeyboardEvent;
    const tag = (keyEvent.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === "textarea" || tag === "input") return;

    const { keyCode } = keyEvent;
    const { readerMode } = this.props;

    if (keyCode === 27) {
      keyEvent.preventDefault();
      keyEvent.stopPropagation();
      this.hideImage(keyEvent);
      return;
    }

    if (!isPrevKey(keyCode, readerMode) && !isNextKey(keyCode, readerMode)) {
      return;
    }

    keyEvent.preventDefault();
    keyEvent.stopPropagation();
    keyEvent.stopImmediatePropagation();
    await this.shiftImage(isPrevKey(keyCode, readerMode) ? -1 : 1);
  };

  showImage = async (event: any) => {
    event.preventDefault();
    if (this.props.isShow) {
      ["left", "right", "top", "bottom"].forEach((pos) =>
        this.props.handleLeaveReader(pos)
      );
    }

    const { rendition } = this.props;
    let href = rendition.getTargetHref(event);
    if (
      href &&
      (rendition.resolveChapter(href) ||
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
      ((event.target.getAttribute("class") || "").includes("footnote") ||
        (event.target.getAttribute("id") || "").includes("footnote"))
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
    if (!href) return;

    const list = (await this.props.rendition.getImageList?.()) || [];
    const images = list.length ? list : [href];
    this.setState({ isShowImage: true });
    this.showAt(findImageIndex(href, images), images);
    requestAnimationFrame(() => {
      this.previewRef.current?.focus({ preventScroll: true });
      window.focus();
    });
  };

  hideImage = (event?: any) => {
    event?.preventDefault?.();
    const image = this.imageRef.current;
    if (image) {
      image.src = "";
      image.style.removeProperty("margin-top");
      image.style.removeProperty("transform");
      image.style.removeProperty("width");
      image.style.removeProperty("height");
    }
    this.setState({
      isShowImage: false,
      imageList: [],
      currentIndex: 0,
      zoomIndex: 0,
      rotateIndex: 0,
    });
  };

  handleZoomIn = () => {
    let image: any = this.imageRef.current;
    if (!image) return;
    if (image.style.width === "200vw" || image.style.height === "200vh") return;
    this.setState({ zoomIndex: this.state.zoomIndex + 1 }, () => {
      if (this.state.imageRatio === "horizontal") {
        image.style.width = `${60 + this.state.zoomIndex * 10}vw`;
      } else {
        image.style.height = `${100 + 10 * this.state.zoomIndex}vh`;
      }
    });
  };

  handleZoomOut = () => {
    let image: any = this.imageRef.current;
    if (!image) return;
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
    let image: any = this.imageRef.current;
    if (!image?.src) return;
    let blob = await fetch(image.src).then((r) => r.blob());
    saveAs(
      blob,
      this.state.imageName
        ? this.state.imageName
        : `${new Date().toLocaleDateString()}`
    );
  };

  handleCopy = async () => {
    let image: any = this.imageRef.current;
    if (!image?.src) return;
    let blob = await fetch(image.src).then((r) => r.blob());

    const img = new Image();
    img.src = URL.createObjectURL(blob);
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(img, 0, 0);

    canvas.toBlob(async (pngBlob) => {
      if (pngBlob) {
        const data = [new ClipboardItem({ "image/png": pngBlob })];
        await (navigator.clipboard as any).write(data);
      }
    }, "image/png");

    URL.revokeObjectURL(img.src);
    toast.success(this.props.t("Image copied to clipboard"));
  };

  handleClock = () => {
    let image: any = this.imageRef.current;
    if (!image) return;
    this.setState({ rotateIndex: this.state.rotateIndex + 1 }, () => {
      image.style.transform = `rotate(${this.state.rotateIndex * 90}deg)`;
    });
  };

  handleCounterClock = () => {
    let image: any = this.imageRef.current;
    if (!image) return;
    this.setState({ rotateIndex: this.state.rotateIndex - 1 }, () => {
      image.style.transform = `rotate(${this.state.rotateIndex * 90}deg)`;
    });
  };

  render() {
    const { isShowImage, imageName, imageRatio } = this.state;
    return (
      <div
        className="image-preview"
        ref={this.previewRef}
        tabIndex={-1}
        style={isShowImage ? {} : { display: "none" }}
      >
        <div
          className="image-background"
          style={isShowImage ? { backgroundColor: "rgba(0,0,0,0.8)" } : {}}
          onClick={this.hideImage}
        />
        {isShowImage && (
          <>
            <div
              className="image-nav image-nav-prev"
              onClick={(e) => {
                e.stopPropagation();
                this.shiftImage(-1);
              }}
            >
              <span className="icon-dropdown image-nav-prev-icon" />
            </div>
            <div
              className="image-nav image-nav-next"
              onClick={(e) => {
                e.stopPropagation();
                this.shiftImage(1);
              }}
            >
              <span className="icon-dropdown image-nav-next-icon" />
            </div>
          </>
        )}
        <div className="image-content">
          <img
            ref={this.imageRef}
            src=""
            alt={imageName}
            className="image"
            style={
              imageRatio === "horizontal"
                ? { width: "60vw" }
                : { height: "100vh" }
            }
          />
        </div>
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
            className="icon-copy-line save-icon"
            onClick={() => {
              this.handleCopy();
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
