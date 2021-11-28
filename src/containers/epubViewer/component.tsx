import React from "react";
import PopupMenu from "../../components/popups/popupMenu";
import { ViewAreaProps, ViewAreaStates } from "./interface";
import RecordLocation from "../../utils/readUtils/recordLocation";
import BookmarkModel from "../../model/Bookmark";
import StyleUtil from "../../utils/readUtils/styleUtil";
import ImageViewer from "../../components/imageViewer";
import Chinese from "chinese-s2t";
import StorageUtil from "../../utils/storageUtil";

declare var window: any;

class EpubViewer extends React.Component<ViewAreaProps, ViewAreaStates> {
  isFirst: boolean;
  constructor(props: ViewAreaProps) {
    super(props);
    this.state = {
      // cfiRange: null,
      rect: null,
      chapterIndex: 0,
      chapter: "",
      pageWidth: 0,
      pageHeight: 0,
    };
    this.isFirst = true;
  }

  componentDidMount() {
    let epub = this.props.currentEpub;
    window.rangy.init(); // 初始化
    this.props.rendition.on("locationChanged", () => {
      this.props.handleReadingEpub(epub);
      this.props.handleOpenMenu(false);
      const currentLocation = this.props.rendition.currentLocation();
      if (!currentLocation.start) {
        return;
      }
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
      let iframe = document.getElementsByTagName("iframe")[0];
      if (!iframe) return;
      let doc = iframe.contentDocument;
      if (!doc) {
        return;
      }
      const currentLocation = this.props.rendition.currentLocation();
      let chapterHref = currentLocation.start.href;
      if (!currentLocation || !currentLocation.start) return;
      this.setState({
        chapterIndex: currentLocation.start.index,
        pageWidth: this.props.currentEpub.rendition._layout.width,
        pageHeight: this.props.currentEpub.rendition._layout.height,
      });
      let chapter = "Unknown Chapter";
      let currentChapter = this.props.flattenChapters.filter(
        (item: any) => item.href.split("#")[0] === chapterHref
      )[0];
      if (currentChapter) {
        chapter = currentChapter.label.trim(" ");
      }
      this.setState({ chapter });
      StyleUtil.addDefaultCss();
      this.props.rendition.themes.default(StyleUtil.getCustomCss(false));
      if (
        StorageUtil.getReaderConfig("convertChinese") &&
        StorageUtil.getReaderConfig("convertChinese") !== "Default"
      ) {
        if (
          StorageUtil.getReaderConfig("convertChinese") ===
          "Simplified To Traditional"
        ) {
          doc.querySelectorAll("p").forEach((item) => {
            item.innerText = Chinese.s2t(item.innerText);
          });
        } else {
          doc.querySelectorAll("p").forEach((item) => {
            item.innerText = Chinese.t2s(item.innerText);
          });
        }
      }
    });
    this.props.rendition.on("selected", (cfiRange: any, contents: any) => {
      var range = contents.range(cfiRange);
      var rect = range.getBoundingClientRect();
      this.setState({ rect });
    });
    this.props.rendition.themes.default(StyleUtil.getCustomCss(false));
    this.props.rendition.display(
      RecordLocation.getCfi(this.props.currentBook.key) === null
        ? null
        : RecordLocation.getCfi(this.props.currentBook.key).cfi
    );
  }

  render() {
    const popupMenuProps = {
      rendition: this.props.rendition,
      rect: this.state.rect,
      pageWidth: this.state.pageWidth,
      pageHeight: this.state.pageHeight,
      chapterIndex: this.state.chapterIndex,
      chapter: this.state.chapter,
    };
    const imageViewerProps = {
      isShow: this.props.isShow,
      rendition: this.props.rendition,
      handleEnterReader: this.props.handleEnterReader,
      handleLeaveReader: this.props.handleLeaveReader,
    };
    return (
      <div className="view-area">
        <ImageViewer {...imageViewerProps} />

        <PopupMenu {...popupMenuProps} />
        <>
          {this.props.isShowBookmark ? <div className="bookmark"></div> : null}
        </>
      </div>
    );
  }
}

export default EpubViewer;
