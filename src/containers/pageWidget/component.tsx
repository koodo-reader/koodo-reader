import React from "react";
import "./background.css";
import { BackgroundProps, BackgroundState } from "./interface";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { Trans } from "react-i18next";
class Background extends React.Component<BackgroundProps, BackgroundState> {
  isFirst: Boolean;
  constructor(props: any) {
    super(props);
    this.state = {
      isSingle: this.props.readerMode !== "double",
      prevPage: 0,
      nextPage: 0,
    };
    this.isFirst = true;
  }

  async UNSAFE_componentWillReceiveProps(nextProps: BackgroundProps) {
    if (nextProps.htmlBook !== this.props.htmlBook && nextProps.htmlBook) {
      await this.handlePageNum(nextProps.htmlBook.rendition);
      nextProps.htmlBook.rendition.on("page-changed", async () => {
        await this.handlePageNum(nextProps.htmlBook.rendition);
      });
    }
    if (nextProps.readerMode !== this.props.readerMode) {
      this.setState({ isSingle: nextProps.readerMode !== "double" });
    }
  }

  async handlePageNum(rendition) {
    let pageInfo = await rendition.getProgress();
    if (
      this.props.currentBook.format === "PDF" &&
      ConfigService.getReaderConfig("isConvertPDF") !== "yes"
    ) {
      this.setState({
        prevPage: pageInfo.currentPage,
        nextPage: pageInfo.currentPage + 1,
      });
      return;
    }
    this.setState({
      prevPage: this.state.isSingle
        ? pageInfo.currentPage
        : pageInfo.currentPage * 2 - 1,
      nextPage: this.state.isSingle
        ? pageInfo.currentPage
        : pageInfo.currentPage * 2,
    });
  }

  render() {
    return (
      <div
        className="background"
        style={{
          color: ConfigService.getReaderConfig("textColor")
            ? ConfigService.getReaderConfig("textColor")
            : "",
          width:
            !this.props.isNavLocked && !this.props.isSettingLocked
              ? "100%"
              : this.props.isNavLocked && this.props.isSettingLocked
              ? "calc(100% - 600px)"
              : "calc(100% - 300px)",
          left: !this.props.isNavLocked ? "0" : "300px",
          right: !this.props.isSettingLocked ? "0" : "300px",
          backgroundColor: this.props.backgroundColor,
          filter: `brightness(${
            ConfigService.getReaderConfig("brightness") || 1
          }) invert(${
            ConfigService.getReaderConfig("isInvert") === "yes" ? 1 : 0
          })`,
        }}
      >
        <div className="header-container">
          {!this.props.isHideHeader && this.props.currentChapter + "" && (
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
              {this.props.currentChapter}
            </p>
          )}
          {!this.props.isHideHeader &&
            this.props.currentChapter + "" &&
            !this.state.isSingle && (
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
          {!this.props.isHideFooter && this.state.prevPage > 0 && (
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
              <Trans i18nKey="Book page" count={this.state.prevPage}>
                Page
                {{
                  count: this.state.prevPage,
                }}
              </Trans>
            </p>
          )}
          {!this.props.isHideFooter &&
            this.state.nextPage > 0 &&
            !this.state.isSingle && (
              <p className="background-page-right">
                <Trans i18nKey="Book page" count={this.state.nextPage}>
                  Page
                  {{
                    count: this.state.nextPage,
                  }}
                </Trans>
              </p>
            )}
        </div>
        <>
          {this.props.isShowBookmark ? <div className="bookmark"></div> : null}
        </>
      </div>
    );
  }
}

export default Background;
