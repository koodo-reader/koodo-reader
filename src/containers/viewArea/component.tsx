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
      } else if (!this.isFirst) {
        //如果过暂时没有解析出locations，就直接记录cfi
        RecordLocation.recordCfi(
          this.props.currentBook.key,
          cfi,
          RecordLocation.getCfi(this.props.currentBook.key).percentage
        );
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
      this.props.rendition.themes.default({
        "a, article, cite, code, div, li, p, pre, span, table": {
          "font-size": `${
            OtherUtil.getReaderConfig("fontSize") || 17
          }px !important`,
          "line-height": `${
            OtherUtil.getReaderConfig("lineHeight") || "1.25"
          } !important`,
          "font-family": `${
            OtherUtil.getReaderConfig("fontFamily") || "Helvetica"
          } !important`,
          color: `${
            OtherUtil.getReaderConfig("textColor")
              ? OtherUtil.getReaderConfig("textColor")
              : ""
          } !important`,
        },
      });
    });
    this.props.rendition.on("selected", (cfiRange: any, contents: any) => {
      var range = contents.range(cfiRange);
      var rect = range.getBoundingClientRect();
      this.setState({ cfiRange, contents, rect });
    });
    this.props.rendition.themes.default({
      "a, article, cite, code, div, li, p, pre, span, table": {
        "font-size": `${
          OtherUtil.getReaderConfig("fontSize") || 17
        }px !important`,
        "line-height": `${
          OtherUtil.getReaderConfig("lineHeight") || "1.25"
        } !important`,
        "font-family": `${
          OtherUtil.getReaderConfig("fontFamily") || "内嵌字体"
        } !important`,
        color: `${
          OtherUtil.getReaderConfig("backgroundColor") === "rgba(44,47,49,1)"
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

  render() {
    const popupMenuProps = {
      rendition: this.props.rendition,
      cfiRange: this.state.cfiRange,
      contents: this.state.contents,
      rect: this.state.rect,
    };
    return (
      <div className="view-area">
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
