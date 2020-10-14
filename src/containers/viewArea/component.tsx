//阅读器图书内容区域
import React from "react";
import "./viewArea.css";
import PopupMenu from "../popupMenu";
import { ViewAreaProps, ViewAreaStates } from "./interface";
import RecordLocation from "../../utils/recordLocation";
import OtherUtil from "../../utils/otherUtil";
import BookmarkModel from "../../model/Bookmark";
import StyleUtil from "../../utils/styleUtil";
import ImageViewer from "../../components/imageViewer";

declare var window: any;

class ViewArea extends React.Component<ViewAreaProps, ViewAreaStates> {
  isFirst: boolean;
  constructor(props: ViewAreaProps) {
    super(props);
    this.state = {
      cfiRange: null,
      contents: null,
      rect: null,
      loading: true,
    };
    this.isFirst = true;
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchLocations(this.props.currentEpub);
  }

  componentDidMount() {
    let epub = this.props.currentEpub;
    (window as any).rangy.init(); // 初始化
    this.props.rendition.on("locationChanged", () => {
      this.props.handleReadingEpub(epub);
      this.props.handleOpenMenu(false);
      const currentLocation = this.props.rendition.currentLocation();
      const cfi = currentLocation.start.cfi;
      this.props.handleShowBookmark(
        this.props.bookmarks &&
          this.props.bookmarks.filter(
            (item: BookmarkModel) => item.cfi === cfi
          )[0]
          ? true
          : false
      );
      if (!this.isFirst && this.props.locations) {
        let percentage = this.props.locations.percentageFromCfi(cfi);
        RecordLocation.recordCfi(this.props.currentBook.key, cfi, percentage);
        this.props.handlePercentage(percentage);
      }
      this.isFirst = false;
    });
    this.props.rendition.on("rendered", () => {
      this.setState({ loading: false });
      let iframe = document.getElementsByTagName("iframe")[0];
      if (!iframe) return;
      let doc = iframe.contentDocument;
      if (!doc) {
        return;
      }
      StyleUtil.addDefaultCss();
    });
    this.props.rendition.on("selected", (cfiRange: any, contents: any) => {
      var range = contents.range(cfiRange);
      var rect = range.getBoundingClientRect();
      this.setState({ cfiRange, contents, rect });
    });
    this.props.rendition.themes.default({
      "a, article, cite, code, div, li, p, pre, span, table": {
        "font-size": `${
          OtherUtil.getReaderConfig("isUseFont") === "yes"
            ? ""
            : OtherUtil.getReaderConfig("fontSize") || 17
        }px !important`,
        "line-height": `${
          OtherUtil.getReaderConfig("isUseFont") === "yes"
            ? ""
            : OtherUtil.getReaderConfig("lineHeight") || "1.25"
        } !important`,
        "font-family": `${
          OtherUtil.getReaderConfig("isUseFont") === "yes"
            ? ""
            : OtherUtil.getReaderConfig("fontFamily") || "Helvetica"
        } !important`,
        color: `${
          OtherUtil.getReaderConfig("theme") === "rgba(44,47,49,1)"
            ? "white"
            : ""
        } !important`,
      },
    });
    this.props.rendition.display(
      RecordLocation.getCfi(this.props.currentBook.key) === null
        ? null
        : RecordLocation.getCfi(this.props.currentBook.key).cfi
    );
  }

  previourChapter = () => {
    const currentLocation = this.props.rendition.currentLocation();
    if (!currentLocation.start) return;
    let chapterIndex = currentLocation.start.index;
    const section = this.props.currentEpub.section(chapterIndex - 1);
    if (section && section.href) {
      this.props.currentEpub.rendition.display(section.href);
    }
  };
  nextChapter = () => {
    const currentLocation = this.props.rendition.currentLocation();
    if (!currentLocation.start) return;
    let chapterIndex = currentLocation.start.index;
    const section = this.props.currentEpub.section(chapterIndex + 1);
    if (section && section.href) {
      this.props.currentEpub.rendition.display(section.href);
    }
  };
  render() {
    const popupMenuProps = {
      rendition: this.props.rendition,
      cfiRange: this.state.cfiRange,
      contents: this.state.contents,
      rect: this.state.rect,
    };
    return (
      <div className="view-area">
        {OtherUtil.getReaderConfig("readerMode") &&
          OtherUtil.getReaderConfig("readerMode") !== "double" &&
          this.props.locations && (
            <>
              <div
                className="previous-chapter-single-container"
                onClick={() => {
                  this.previourChapter();
                }}
              >
                <span className="icon-dropdown previous-chapter-single"></span>
              </div>
              <div
                className="next-chapter-single-container"
                onClick={() => {
                  this.nextChapter();
                }}
              >
                <span className="icon-dropdown next-chapter-single"></span>
              </div>
            </>
          )}
        <ImageViewer
          {...{
            isShow: this.props.isShow,
            rendition: this.props.rendition,
            handleEnterReader: this.props.handleEnterReader,
            handleLeaveReader: this.props.handleLeaveReader,
          }}
        />
        <PopupMenu {...popupMenuProps} />
        {this.state.loading ? (
          <div className="spinner">
            <div className="sk-chase">
              <div className="sk-chase-dot"></div>
              <div className="sk-chase-dot"></div>
              <div className="sk-chase-dot"></div>
              <div className="sk-chase-dot"></div>
              <div className="sk-chase-dot"></div>
              <div className="sk-chase-dot"></div>
            </div>
          </div>
        ) : null}
        <>
          {this.props.isShowBookmark ? <div className="bookmark"></div> : null}
        </>
      </div>
    );
  }
}

export default ViewArea;
