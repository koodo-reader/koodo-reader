//图书下面的背景，包括页边和书脊
import React from "react";
import "./background.css";
import { BackgroundProps, BackgroundState } from "./interface";
import OtherUtil from "../../utils/otherUtil";
import { Trans } from "react-i18next";

class Background extends React.Component<BackgroundProps, BackgroundState> {
  constructor(props: any) {
    super(props);
    this.state = {
      isSingle:
        OtherUtil.getReaderConfig("readerMode") === "single" ||
        OtherUtil.getReaderConfig("readerMode") === "scroll",
      currentChapter: "",
      prevPage: 0,
      nextPage: 0,
    };
  }
  componentWillReceiveProps(nextProps: BackgroundProps) {
    if (nextProps.currentEpub.rendition.location) {
      const currentLocation = this.props.currentEpub.rendition.currentLocation();
      if (!currentLocation.start) {
        return;
      }
      this.setState({
        prevPage: currentLocation.start.displayed.page,
        nextPage: currentLocation.end.displayed.page,
      });
      let chapterHref = currentLocation.start.href;
      let chapter = "Unknown Chapter";
      let currentChapter = this.props.flattenChapters.filter(
        (item: any) => item.href.split("#")[0] === chapterHref
      )[0];
      if (currentChapter) {
        chapter = currentChapter.label.trim(" ");
      }
      this.setState({ currentChapter: chapter });
    }
  }
  render() {
    if (OtherUtil.getReaderConfig("isUseBackground") === "yes") {
      return <div className="background"></div>;
    }
    return (
      <div className="background">
        <div
          className="background-box2"
          style={
            this.state.isSingle
              ? {
                  left: "calc(50vw - 279px)",
                  right: "calc(50vw - 277px)",
                  boxShadow: "0 0 0px rgba(191, 191, 191, 1)",
                }
              : {}
          }
        ></div>
        <div
          className="background-box3"
          style={
            this.state.isSingle
              ? { left: "calc(50vw - 279px)", right: "calc(50vw - 279px)" }
              : {}
          }
        >
          <div
            className="spine-shadow-left"
            style={
              this.state.isSingle ||
              OtherUtil.getReaderConfig("theme") === "rgba(44,47,49,1)"
                ? { display: "none" }
                : {}
            }
          ></div>
          <div
            className="book-spine"
            style={this.state.isSingle ? { display: "none" } : {}}
          ></div>
          <div
            className="spine-shadow-right"
            style={
              OtherUtil.getReaderConfig("theme") === "rgba(44,47,49,1)"
                ? { display: "none" }
                : this.state.isSingle
                ? { left: "calc(50% - 300px)" }
                : {}
            }
          ></div>
        </div>

        <div
          className="background-box1"
          style={
            this.state.isSingle
              ? {
                  left: "calc(50vw - 279px)",
                  right: "calc(50vw - 275px)",
                  boxShadow: "0 0 0px rgba(191, 191, 191, 1)",
                }
              : {}
          }
        >
          {this.state.currentChapter && (
            <p
              className="progress-chapter-name"
              style={this.state.isSingle ? { left: "calc(50% - 270px)" } : {}}
            >
              <Trans>{this.state.currentChapter}</Trans>
            </p>
          )}

          {!this.state.isSingle && (
            <p
              className="progress-book-name"
              style={this.state.isSingle ? { right: "calc(50% - 270px)" } : {}}
            >
              <Trans>{this.props.currentBook.name}</Trans>
            </p>
          )}

          {this.state.prevPage > 0 && (
            <p
              className="background-page-left"
              style={this.state.isSingle ? { left: "calc(50% - 270px)" } : {}}
            >
              第{this.state.prevPage}页
            </p>
          )}
          {this.state.nextPage > 0 && !this.state.isSingle && (
            <p className="background-page-right">第{this.state.nextPage}页</p>
          )}
        </div>
      </div>
    );
  }
}

export default Background;
