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
      isOpenSettingPanel:
        OtherUtil.getReaderConfig("isSettingLocked") === "yes" ? true : false,
      isOpenOperationPanel: false,
      isOpenProgressPanel: false,
      isOpenNavPanel:
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
      this.messageTimer = setTimeout(() => {
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
        if (OtherUtil.getReaderConfig("isSettingLocked") === "yes") {
          break;
        } else {
          this.setState({ isOpenSettingPanel: false });
          break;
        }

      case "left":
        if (OtherUtil.getReaderConfig("isNavLocked") === "yes") {
          break;
        } else {
          this.setState({ isOpenNavPanel: false });
          break;
        }
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
        this.state.isOpenNavPanel ||
        this.state.isOpenOperationPanel ||
        this.state.isOpenProgressPanel ||
        this.state.isOpenSettingPanel,
    };
    return (
      <div className="viewer">
        <div
          className="previous-chapter-single-container"
          onClick={() => {
            this.prevPage();
          }}
        >
          <span className="icon-dropdown previous-chapter-single"></span>
        </div>
        <div
          className="next-chapter-single-container"
          onClick={() => {
            this.nextPage();
          }}
        >
          <span className="icon-dropdown next-chapter-single"></span>
        </div>
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
        <Viewer {...renditionProps} />
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
                }
          }
        >
          {this.props.currentEpub.rendition && (
            <ProgressPanel {...{ time: this.state.time }} />
          )}
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
