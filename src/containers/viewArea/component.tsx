import React from "react";
import "./viewArea.css";
import PopupMenu from "../popupMenu";
import ViewPage from "../../components/viewPage";
import { ViewAreaProps, ViewAreaStates } from "./interface";

class ViewArea extends React.Component<ViewAreaProps, ViewAreaStates> {
  constructor(props: ViewAreaProps) {
    super(props);
    this.state = {
      isShowImage: false,
      imageRatio: "horizontal",
    };
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchLocations(this.props.currentEpub);
  }

  componentDidMount() {
    this.props.currentEpub.on("renderer:chapterDisplayed", () => {
      let doc = this.props.currentEpub.renderer.doc;

      doc.addEventListener("click", this.showImage);
    });
  }
  showImage = (event: any) => {
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
        <PopupMenu />
        <ViewPage />
      </div>
    );
  }
}

export default ViewArea;
