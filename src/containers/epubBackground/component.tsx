import React from "react";
import "./background.css";
import { BackgroundProps, BackgroundState } from "./interface";
import OtherUtil from "../../utils/otherUtil";
import { Trans } from "react-i18next";
import BackgroundWidget from "../../components/backgroundWidget";
class Background extends React.Component<BackgroundProps, BackgroundState> {
  isFirst: Boolean;
  constructor(props: any) {
    super(props);
    this.state = {
      isSingle:
        OtherUtil.getReaderConfig("readerMode") &&
        OtherUtil.getReaderConfig("readerMode") !== "double",
      currentChapter: "",
      prevPage: 0,
      nextPage: 0,
      scale: OtherUtil.getReaderConfig("scale") || 1,
      isHideFooter: OtherUtil.getReaderConfig("isHideFooter") === "yes",
      isHideHeader: OtherUtil.getReaderConfig("isHideHeader") === "yes",
      isUseBackground: OtherUtil.getReaderConfig("isUseBackground") === "yes",
    };
    this.isFirst = true;
  }

  componentWillReceiveProps(nextProps: BackgroundProps) {
    if (
      nextProps.currentEpub.rendition &&
      nextProps.currentEpub.rendition.location &&
      this.props.currentEpub.rendition
    ) {
      const currentLocation = this.props.currentEpub.rendition.currentLocation();
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
        (item: any) => item.href.split("#")[0] === chapterHref
      )[0];
      if (currentChapter) {
        chapter = currentChapter.label.trim(" ");
      }
      this.setState({ currentChapter: chapter });
    }
  }

  render() {
    if (this.state.isUseBackground) {
      return (
        <div
          className="background"
          style={{
            color: OtherUtil.getReaderConfig("textColor")
              ? OtherUtil.getReaderConfig("textColor")
              : "",
          }}
        >
          {!this.state.isHideHeader && this.state.currentChapter && (
            <p
              className="progress-chapter-name"
              style={
                this.state.isSingle
                  ? {
                      left: `calc(50vw - 
                      270px)`,
                    }
                  : {}
              }
            >
              <Trans>{this.state.currentChapter}</Trans>
            </p>
          )}
          {!this.state.isHideHeader && !this.state.isSingle && (
            <p
              className="progress-book-name"
              style={
                this.state.isSingle
                  ? {
                      right: `calc(50vw - 
                      270px)`,
                    }
                  : {}
              }
            >
              <Trans>{this.props.currentBook.name}</Trans>
            </p>
          )}
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
      );
    }
    return (
      <div
        className="background"
        style={{
          color: OtherUtil.getReaderConfig("textColor")
            ? OtherUtil.getReaderConfig("textColor")
            : "",
        }}
      >
        {!this.state.isHideHeader && this.state.currentChapter && (
          <p
            className="progress-chapter-name"
            style={
              this.state.isSingle
                ? {
                    left: `calc(50vw - 
                      270px)`,
                  }
                : {}
            }
          >
            <Trans>{this.state.currentChapter}</Trans>
          </p>
        )}

        {!this.state.isHideHeader && !this.state.isSingle && (
          <p
            className="progress-book-name"
            style={
              this.state.isSingle
                ? {
                    right: `calc(50vw - 
                      270px)`,
                  }
                : {}
            }
          >
            <Trans>{this.props.currentBook.name}</Trans>
          </p>
        )}

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
        <BackgroundWidget />
      </div>
    );
  }
}

export default Background;
