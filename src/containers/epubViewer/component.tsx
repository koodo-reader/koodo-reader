import React from "react";
import ViewArea from "../viewArea";
import Background from "../background";
import SettingPanel from "../settingPanel";
import NavigationPanel from "../navigationPanel";
import OperationPanel from "../operationPanel";
import MessageBox from "../messageBox";
import ProgressPanel from "../progressPanel";
import { ReaderProps, ReaderState } from "./interface";
import { MouseEvent } from "../../utils/mouseEvent";
import OtherUtil from "../../utils/otherUtil";
import ReadingTime from "../../utils/readingTime";

class Reader extends React.Component<ReaderProps, ReaderState> {
  messageTimer!: NodeJS.Timeout;
  tickTimer!: NodeJS.Timeout;
  rendition: any;

  constructor(props: ReaderProps) {
    super(props);
    this.state = {
      isOpenSettingPanel: false,
      isOpenOperationPanel: false,
      isOpenProgressPanel: false,
      isOpenNavPanel: false,
      isMessage: false,
      rendition: null,
      scale: OtherUtil.getReaderConfig("scale") || 1,
      time: ReadingTime.getTime(this.props.currentBook.key),
      isTouch: OtherUtil.getReaderConfig("isTouch") === "yes",
      readerMode: OtherUtil.getReaderConfig("readerMode") || "double",
    };
  }
  componentWillMount() {
    this.props.handleFetchBookmarks();
    this.props.handleFetchPercentage(this.props.currentBook);
    this.props.handleFetchNotes();
    this.props.handleFetchChapters(this.props.currentEpub);
  }
  UNSAFE_componentWillReceiveProps(nextProps: ReaderProps) {
    this.setState({
      isMessage: nextProps.isMessage,
    });

    //控制消息提示两秒之后消失
    if (nextProps.isMessage) {
      this.messageTimer = setTimeout(() => {
        this.props.handleMessageBox(false);
        this.setState({ isMessage: false });
      }, 2000);
    }
  }
  componentDidMount() {
    console.log(window.location.href, "rendered");
    let page = document.querySelector("#page-area");
    let epub = this.props.currentEpub;
    (window as any).rangy.init(); // 初始化
    this.rendition = epub.renderTo(page, {
      manager:
        this.state.readerMode === "continuous" ? "continuous" : "default",
      flow:
        this.state.readerMode === "scroll"
          ? "scrolled-doc"
          : this.state.readerMode === "continuous"
          ? "scrolled"
          : "auto",
      width: "100%",
      height: "100%",
      snap: true,
    });
    this.setState({ rendition: this.rendition });
    this.state.readerMode !== "scroll" &&
      this.state.readerMode !== "continuous" &&
      MouseEvent(this.rendition); // 绑定事件
    this.tickTimer = setInterval(() => {
      let time = this.state.time;
      time += 1;
      this.setState({ time });
    }, 1000);
  }

  componentWillUnmount() {
    //清除上面的计时器
    clearTimeout(this.messageTimer);
    setTimeout(() => {}, 5000);
    clearInterval(this.tickTimer);
    ReadingTime.setTime(this.props.currentBook.key, this.state.time);
  }
  //进入阅读器
  handleEnterReader = (position: string) => {
    //控制上下左右的菜单的显示
    switch (position) {
      case "right":
        this.setState({
          isOpenSettingPanel: this.state.isOpenSettingPanel ? false : true,
        });
        break;
      case "left":
        this.setState({
          isOpenNavPanel: this.state.isOpenNavPanel ? false : true,
        });
        break;
      case "top":
        this.setState({
          isOpenOperationPanel: this.state.isOpenOperationPanel ? false : true,
        });
        break;
      case "bottom":
        this.setState({
          isOpenProgressPanel: this.state.isOpenProgressPanel ? false : true,
        });
        break;
      default:
        break;
    }
  };
  //退出阅读器
  handleLeaveReader = (position: string) => {
    //控制上下左右的菜单的显示
    switch (position) {
      case "right":
        this.setState({ isOpenSettingPanel: false });
        break;
      case "left":
        this.setState({ isOpenNavPanel: false });
        break;
      case "top":
        this.setState({ isOpenOperationPanel: false });
        break;
      case "bottom":
        this.setState({ isOpenProgressPanel: false });
        break;
      default:
        break;
    }
  };

  render() {
    const renditionProps = {
      rendition: this.state.rendition,
      handleLeaveReader: this.handleLeaveReader,
      handleEnterReader: this.handleEnterReader,
      isShow:
        this.state.isOpenNavPanel ||
        this.state.isOpenOperationPanel ||
        this.state.isOpenProgressPanel ||
        this.state.isOpenSettingPanel,
    };
    return (
      <div className="viewer">
        {this.state.isMessage ? <MessageBox /> : null}
        <div
          className="left-panel"
          onMouseEnter={() => {
            if (this.state.isTouch || this.state.isOpenNavPanel) {
              return;
            }
            this.handleEnterReader("left");
          }}
          onClick={() => {
            this.handleEnterReader("left");
          }}
        ></div>
        <div
          className="right-panel"
          onMouseEnter={() => {
            if (this.state.isTouch || this.state.isOpenSettingPanel) {
              return;
            }
            this.handleEnterReader("right");
          }}
          onClick={() => {
            this.handleEnterReader("right");
          }}
        ></div>
        <div
          className="top-panel"
          onMouseEnter={() => {
            if (this.state.isTouch || this.state.isOpenOperationPanel) {
              return;
            }
            this.handleEnterReader("top");
          }}
          onClick={() => {
            this.handleEnterReader("top");
          }}
        ></div>
        <div
          className="bottom-panel"
          onMouseEnter={() => {
            if (this.state.isTouch || this.state.isOpenProgressPanel) {
              return;
            }
            this.handleEnterReader("bottom");
          }}
          onClick={() => {
            this.handleEnterReader("bottom");
          }}
        ></div>

        {this.state.rendition && this.props.currentEpub.rendition && (
          <ViewArea {...renditionProps} />
        )}
        <div
          className="setting-panel-container"
          onMouseLeave={(event) => {
            this.handleLeaveReader("right");
          }}
          style={
            this.state.isOpenSettingPanel
              ? {}
              : {
                  transform: "translateX(309px)",
                  // transition: "transform 1s ease",
                  // display: "none",
                }
          }
        >
          <SettingPanel />
        </div>
        <div
          className="navigation-panel-container"
          onMouseLeave={(event) => {
            this.handleLeaveReader("left");
          }}
          style={
            this.state.isOpenNavPanel
              ? {}
              : {
                  transform: "translateX(-309px)",
                  // transition: "transform 1s ease",
                  // display: "none",
                }
          }
        >
          <NavigationPanel {...{ time: this.state.time }} />
        </div>
        <div
          className="progress-panel-container"
          onMouseLeave={(event) => {
            this.handleLeaveReader("bottom");
          }}
          style={
            this.state.isOpenProgressPanel
              ? {}
              : {
                  transform: "translateY(110px)",
                  // transition: "transform 0.5s ease",
                  // display: "none",
                }
          }
        >
          <ProgressPanel {...{ time: this.state.time }} />
        </div>
        <div
          className="operation-panel-container"
          onMouseLeave={(event) => {
            this.handleLeaveReader("top");
          }}
          style={
            this.state.isOpenOperationPanel
              ? {}
              : {
                  transform: "translateY(-110px)",
                  // transition: "transform 0.5s ease",
                  // display: "none",
                }
          }
        >
          <OperationPanel {...{ time: this.state.time }} />
        </div>

        <div
          className="view-area-page"
          id="page-area"
          style={
            this.state.readerMode === "scroll" ||
            this.state.readerMode === "continuous"
              ? {
                  left: `calc(50vw - ${270 * parseFloat(this.state.scale)}px)`,
                  right: `calc(50vw - ${270 * parseFloat(this.state.scale)}px)`,
                  top: "75px",
                  bottom: "75px",
                }
              : this.state.readerMode === "single"
              ? {
                  left: `calc(50vw - ${270 * parseFloat(this.state.scale)}px)`,
                  right: `calc(50vw - ${270 * parseFloat(this.state.scale)}px)`,
                }
              : {}
          }
        ></div>

        <Background {...{ time: this.state.time }} />
      </div>
    );
  }
}

export default Reader;
