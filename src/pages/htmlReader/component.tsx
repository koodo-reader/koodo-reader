import React from "react";
import SettingPanel from "../../containers/panels/settingPanel";
import NavigationPanel from "../../containers/panels/navigationPanel";
import OperationPanel from "../../containers/panels/operationPanel";
import MessageBox from "../../containers/messageBox";
import ProgressPanel from "../../containers/panels/progressPanel";
import { ReaderProps, ReaderState } from "./interface";
import OtherUtil from "../../utils/otherUtil";
import ReadingTime from "../../utils/readUtils/readingTime";
import Viewer from "../../containers/htmlViewer";

class Reader extends React.Component<ReaderProps, ReaderState> {
  messageTimer!: NodeJS.Timeout;
  tickTimer!: NodeJS.Timeout;
  rendition: any;

  constructor(props: ReaderProps) {
    super(props);
    this.state = {
      isOpenRightPanel:
        OtherUtil.getReaderConfig("isSettingLocked") === "yes" ? true : false,
      isOpenTopPanel: false,
      isOpenBottomPanel: false,
      isOpenLeftPanel:
        OtherUtil.getReaderConfig("isNavLocked") === "yes" ? true : false,
      isMessage: false,
      rendition: null,
      scale: OtherUtil.getReaderConfig("scale") || 1,
      margin: parseInt(OtherUtil.getReaderConfig("margin")) || 30,
      time: ReadingTime.getTime(this.props.currentBook.key),
      isTouch: OtherUtil.getReaderConfig("isTouch") === "yes",
      readerMode: OtherUtil.getReaderConfig("readerMode") || "double",
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps: ReaderProps) {
    this.setState({
      isMessage: nextProps.isMessage,
    });

    //控制消息提示两秒之后消失
    if (nextProps.isMessage) {
      this.messageTimer = global.setTimeout(() => {
        this.props.handleMessageBox(false);
        this.setState({ isMessage: false });
      }, 2000);
    }
  }

  //进入阅读器
  handleEnterReader = (position: string) => {
    //控制上下左右的菜单的显示
    switch (position) {
      case "right":
        this.setState({
          isOpenRightPanel: this.state.isOpenRightPanel ? false : true,
        });
        break;
      case "left":
        this.setState({
          isOpenLeftPanel: this.state.isOpenLeftPanel ? false : true,
        });
        break;
      case "top":
        this.setState({
          isOpenTopPanel: this.state.isOpenTopPanel ? false : true,
        });
        break;
      case "bottom":
        this.setState({
          isOpenBottomPanel: this.state.isOpenBottomPanel ? false : true,
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
        if (OtherUtil.getReaderConfig("isSettingLocked") === "yes") {
          break;
        } else {
          this.setState({ isOpenRightPanel: false });
          break;
        }

      case "left":
        if (OtherUtil.getReaderConfig("isNavLocked") === "yes") {
          break;
        } else {
          this.setState({ isOpenLeftPanel: false });
          break;
        }
      case "top":
        this.setState({ isOpenTopPanel: false });
        break;
      case "bottom":
        this.setState({ isOpenBottomPanel: false });
        break;
      default:
        break;
    }
  };
  nextPage = () => {
    this.state.rendition.next();
  };
  prevPage = () => {
    this.state.rendition.prev();
  };
  render() {
    const renditionProps = {
      rendition: this.state.rendition,
      handleLeaveReader: this.handleLeaveReader,
      handleEnterReader: this.handleEnterReader,
      isShow:
        this.state.isOpenLeftPanel ||
        this.state.isOpenTopPanel ||
        this.state.isOpenBottomPanel ||
        this.state.isOpenRightPanel,
    };
    return (
      <div className="viewer">
        <div
          className="reader-setting-icon-container"
          onClick={() => {
            this.handleEnterReader("left");
            this.handleEnterReader("right");
            this.handleEnterReader("bottom");
            this.handleEnterReader("top");
          }}
        >
          <span className="icon-grid reader-setting-icon"></span>
        </div>
        {this.state.isMessage ? <MessageBox /> : null}
        <div
          className="left-panel"
          onMouseEnter={() => {
            if (this.state.isTouch || this.state.isOpenLeftPanel) {
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
            if (this.state.isTouch || this.state.isOpenRightPanel) {
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
            if (this.state.isTouch || this.state.isOpenTopPanel) {
              return;
            }
            this.handleEnterReader("top");
          }}
          onClick={() => {
            this.handleEnterReader("top");
          }}
        ></div>
        {Object.keys(this.props.currentEpub).length !== 0 && (
          <div
            className="bottom-panel"
            onMouseEnter={() => {
              if (this.state.isTouch || this.state.isOpenBottomPanel) {
                return;
              }
              this.handleEnterReader("bottom");
            }}
            onClick={() => {
              this.handleEnterReader("bottom");
            }}
          ></div>
        )}
        <Viewer {...renditionProps} />
        <div
          className="setting-panel-container"
          onMouseLeave={(event) => {
            this.handleLeaveReader("right");
          }}
          style={
            this.state.isOpenRightPanel
              ? {}
              : {
                  transform: "translateX(309px)",
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
            this.state.isOpenLeftPanel
              ? {}
              : {
                  transform: "translateX(-309px)",
                }
          }
        >
          <NavigationPanel {...{ time: this.state.time }} />
        </div>
        {Object.keys(this.props.currentEpub).length !== 0 && (
          <div
            className="progress-panel-container"
            onMouseLeave={(event) => {
              this.handleLeaveReader("bottom");
            }}
            style={
              this.state.isOpenBottomPanel
                ? {}
                : {
                    transform: "translateY(110px)",
                  }
            }
          >
            <ProgressPanel {...{ time: this.state.time }} />
          </div>
        )}
        <div
          className="operation-panel-container"
          onMouseLeave={(event) => {
            this.handleLeaveReader("top");
          }}
          style={
            this.state.isOpenTopPanel
              ? {}
              : {
                  transform: "translateY(-110px)",
                }
          }
        >
          <OperationPanel {...{ time: this.state.time }} />
        </div>
      </div>
    );
  }
}

export default Reader;
