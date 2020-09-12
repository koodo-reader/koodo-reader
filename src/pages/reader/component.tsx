import React from "react";
import ViewArea from "../../containers/viewArea";
import Background from "../../containers/background";
import SettingPanel from "../../containers/settingPanel";
import NavigationPanel from "../../containers/navigationPanel";
import OperationPanel from "../../containers/operationPanel";
import MessageBox from "../../containers/messageBox";
import ProgressPanel from "../../containers/progressPanel";
import { ReaderProps, ReaderState } from "./interface";
import { MouseEvent } from "../../utils/mouseEvent";
import OtherUtil from "../../utils/otherUtil";

class Reader extends React.Component<ReaderProps, ReaderState> {
  timer!: NodeJS.Timeout;
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
      this.timer = setTimeout(() => {
        this.props.handleMessageBox(false);
        this.setState({ isMessage: false });
      }, 2000);
    }
  }
  componentDidMount() {
    let page = document.querySelector("#page-area");
    let epub = this.props.currentEpub;
    (window as any).rangy.init(); // 初始化
    this.rendition = epub.renderTo(page, {
      manager: "default",
      flow: this.state.readerMode === "scroll" ? "scrolled-doc" : "auto",
      width: "100%",
      height: "100%",
    });
    this.setState({ rendition: this.rendition });
    this.state.readerMode !== "scroll" && MouseEvent(this.rendition); // 绑定事件
  }
  componentWillUnmount() {
    //清除上面的计时器
    clearTimeout(this.timer);
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
  handleLeaveReader = (event: any, position: string) => {
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
    };
    return (
      <div className="viewer">
        {this.state.isMessage ? <MessageBox /> : null}
        <div
          className="left-panel"
          onMouseEnter={() => {
            this.handleEnterReader("left");
          }}
        ></div>
        <div
          className="right-panel"
          onMouseEnter={() => {
            this.handleEnterReader("right");
          }}
        ></div>
        <div
          className="top-panel"
          onMouseEnter={() => {
            this.handleEnterReader("top");
          }}
        ></div>
        <div
          className="bottom-panel"
          onMouseEnter={() => {
            this.handleEnterReader("bottom");
          }}
        ></div>
        {this.state.rendition && <ViewArea {...renditionProps} />}
        <div
          className="setting-panel-container"
          onMouseLeave={(event) => {
            this.handleLeaveReader(event, "right");
          }}
          style={
            this.state.isOpenSettingPanel
              ? {}
              : {
                  transition: "transform 0.6s ease",
                  transform: "translateX(309px)",
                  display: "none",
                }
          }
        >
          <SettingPanel {...renditionProps} />
        </div>
        <div
          className="navigation-panel-container"
          onMouseLeave={(event) => {
            this.handleLeaveReader(event, "left");
          }}
          style={
            this.state.isOpenNavPanel
              ? {}
              : {
                  transform: "translateX(-309px)",
                  transition: "transform 0.6s ease",
                  display: "none",
                }
          }
        >
          <NavigationPanel />
        </div>
        <div
          className="progress-panel-container"
          onMouseLeave={(event) => {
            this.handleLeaveReader(event, "bottom");
          }}
          style={
            this.state.isOpenProgressPanel
              ? {}
              : {
                  transform: "translateY(90px)",
                  transition: "transform 0.5s ease",
                  display: "none",
                }
          }
        >
          <ProgressPanel {...renditionProps} />
        </div>
        <div
          className="operation-panel-container"
          onMouseLeave={(event) => {
            this.handleLeaveReader(event, "top");
          }}
          style={
            this.state.isOpenOperationPanel
              ? {}
              : {
                  transform: "translateY(-90px)",
                  transition: "transform 0.5s ease",
                  display: "none",
                }
          }
        >
          <OperationPanel {...renditionProps} />
        </div>
        <div
          className="view-area-page"
          id="page-area"
          style={
            this.state.readerMode === "scroll"
              ? {
                  left: "calc(50vw - 270px)",
                  right: "calc(50vw - 270px)",
                  top: "75px",
                  bottom: "75px",
                }
              : this.state.readerMode === "single"
              ? { left: "calc(50vw - 270px)", right: "calc(50vw - 270px)" }
              : {}
          }
        ></div>
        <Background />
      </div>
    );
  }
}

export default Reader;
