import React from "react";
import "./background.css";
import { BackgroundProps, BackgroundState } from "./interface";
import StorageUtil from "../../utils/storageUtil";
import { Trans } from "react-i18next";
class Background extends React.Component<BackgroundProps, BackgroundState> {
  isFirst: Boolean;
  constructor(props: any) {
    super(props);
    this.state = {
      isSingle:
        StorageUtil.getReaderConfig("readerMode") &&
        StorageUtil.getReaderConfig("readerMode") !== "double",
      currentChapter: "",
      prevPage: 0,
      nextPage: 0,
      scale: StorageUtil.getReaderConfig("scale") || 1,
      isHideFooter: StorageUtil.getReaderConfig("isHideFooter") === "yes",
      isHideHeader: StorageUtil.getReaderConfig("isHideHeader") === "yes",
    };
    this.isFirst = true;
  }

  componentWillReceiveProps(nextProps: BackgroundProps) {
    if (
      nextProps.currentEpub.rendition &&
      nextProps.currentEpub.rendition.location &&
      this.props.currentEpub.rendition
    ) {
      const currentLocation =
        this.props.currentEpub.rendition.currentLocation();
      if (!currentLocation.start) {
        return;
      }
      this.isFirst && this.props.handleFetchLocations(this.props.currentEpub);
      this.isFirst = false;
      this.setState({
        prevPage: currentLocation.start.displayed.page,
        nextPage: currentLocation.end.displayed.page,
      });
      let chapterHref = currentLocation.start.href;

      let chapter = "Unknown Chapter";
      let currentChapter = this.props.flattenChapters.filter(
        (item: any) =>
          item.href.indexOf(chapterHref) > -1 ||
          chapterHref.indexOf(item.href) > -1
      )[0];
      if (currentChapter) {
        chapter = currentChapter.label.trim(" ");
      }
      this.setState({ currentChapter: chapter });
    }
  }

  render() {
    return (
      <div
        className="background"
        style={{
          color: StorageUtil.getReaderConfig("textColor")
            ? StorageUtil.getReaderConfig("textColor")
            : "",
        }}
      >
        <div className="header-container">
          {!this.state.isHideHeader && this.state.currentChapter && (
            <p
              className="header-chapter-name"
              style={
                this.state.isSingle
                  ? {
                      left: `calc(50vw - 
                      270px)`,
                    }
                  : {}
              }
            >
              {this.state.currentChapter}
            </p>
          )}
          {!this.state.isHideHeader && !this.state.isSingle && (
            <p
              className="header-book-name"
              style={
                this.state.isSingle
                  ? {
                      right: `calc(50vw - 
                      270px)`,
                    }
                  : {}
              }
            >
              {this.props.currentBook.name}
            </p>
          )}
        </div>
        <div className="footer-container">
          {!this.state.isHideFooter && this.state.prevPage > 0 && (
            <p
              className="background-page-left"
              style={
                this.state.isSingle
                  ? {
                      left: `calc(50vw - 
                      270px)`,
                    }
                  : {}
              }
            >
              <Trans i18nKey="Book Page" count={this.state.prevPage}>
                Page
                {{
                  count: this.state.prevPage,
                }}
              </Trans>
            </p>
          )}
          {!this.state.isHideFooter &&
            this.state.nextPage > 0 &&
            !this.state.isSingle && (
              <p className="background-page-right">
                <Trans i18nKey="Book Page" count={this.state.nextPage}>
                  Page
                  {{
                    count: this.state.nextPage,
                  }}
                </Trans>
              </p>
            )}
        </div>
      </div>
    );
  }
}

export default Background;
