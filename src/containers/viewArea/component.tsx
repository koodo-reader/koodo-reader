import React from "react";
import "./viewArea.css";
import PopupMenu from "../popupMenu";
import ViewPage from "../../components/viewPage";
import { ViewAreaProps, ViewAreaStates } from "./interface";

class ViewArea extends React.Component<ViewAreaProps, ViewAreaStates> {
  constructor(props: ViewAreaProps) {
    super(props);
    this.state = { isShowImage: false };
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
    if (event.target.src) {
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
          <img src="" alt="" className="image" />
        </div>
        <PopupMenu />
        <ViewPage />
      </div>
    );
  }
}

export default ViewArea;
