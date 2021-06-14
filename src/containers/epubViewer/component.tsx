//阅读器图书内容区域
import React from "react";
import PopupMenu from "../../components/popups/popupMenu";
import { ViewAreaProps, ViewAreaStates } from "./interface";
import RecordLocation from "../../utils/readUtils/recordLocation";
import BookmarkModel from "../../model/Bookmark";
import StyleUtil from "../../utils/readUtils/styleUtil";
import ImageViewer from "../../components/imageViewer";
import Lottie from "react-lottie";
import animationSiri from "../../assets/lotties/siri.json";

const siriOptions = {
  loop: true,
  autoplay: true,
  animationData: animationSiri,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};
declare var window: any;

class EpubViewer extends React.Component<ViewAreaProps, ViewAreaStates> {
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
      this.setState({ loading: false });
      let iframe = document.getElementsByTagName("iframe")[0];
      if (!iframe) return;
      let doc = iframe.contentDocument;
      if (!doc) {
        return;
      }
      StyleUtil.addDefaultCss();
      this.props.rendition.themes.default(StyleUtil.getCustomCss(false));
    });
    this.props.rendition.on("selected", (cfiRange: any, contents: any) => {
      var range = contents.range(cfiRange);
      var rect = range.getBoundingClientRect();
      this.setState({ cfiRange, contents, rect });
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
            <Lottie options={siriOptions} height={100} width={300} />
          </div>
        ) : null}
        <>
          {this.props.isShowBookmark ? <div className="bookmark"></div> : null}
        </>
      </div>
    );
  }
}

export default EpubViewer;
