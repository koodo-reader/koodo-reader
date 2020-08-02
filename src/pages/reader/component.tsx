import React from "react";
import ViewArea from "../../containers/viewArea";
import Background from "../../containers/background";
import SettingPanel from "../../containers/settingPanel";
import NavigationPanel from "../../containers/navigationPanel";
import OperationPanel from "../../containers/operationPanel";
import MessageBox from "../../containers/messageBox";
import ProgressPanel from "../../containers/progressPanel";
import { ReaderProps, ReaderState } from "./interface";
class Reader extends React.Component<ReaderProps, ReaderState> {
  timer!: NodeJS.Timeout;
  constructor(props: ReaderProps) {
    super(props);
    this.state = {
      isOpenSettingPanel: false,
      isOpenOperationPanel: false,
      isOpenProgressPanel: false,
      isOpenInfoPanel: false,
      isMessage: false,
    };
  }
  componentWillMount() {
    this.props.handleFetchBookmarks();
    this.props.handleFetchPercentage(this.props.currentBook);
    this.props.handleFetchNotes();
    this.props.handleFetchDigests();
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
    (window as any).rangy.init(); // 初始化rangy插件，用于高亮
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
          isOpenInfoPanel: this.state.isOpenInfoPanel ? false : true,
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
        this.setState({ isOpenInfoPanel: false });
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
        <ViewArea />
        //控制阅读器设置的显示
        {this.state.isOpenSettingPanel ? (
          <div
            onMouseLeave={(event) => {
              this.handleLeaveReader(event, "right");
            }}
          >
            <SettingPanel />
          </div>
        ) : null}
        //控制图书信息的显示
        {this.state.isOpenInfoPanel ? (
          <div
            onMouseLeave={(event) => {
              this.handleLeaveReader(event, "left");
            }}
          >
            <NavigationPanel />
          </div>
        ) : null}
        //控制阅读进度条的显示
        {this.state.isOpenProgressPanel ? (
          <div
            className="progress-panel-container"
            onMouseLeave={(event) => {
              this.handleLeaveReader(event, "bottom");
            }}
          >
            <ProgressPanel />
          </div>
        ) : null}
        //控制阅读器控制栏的显示
        {this.state.isOpenOperationPanel ? (
          <div
            className="operation-panel-container"
            onMouseLeave={(event) => {
              this.handleLeaveReader(event, "top");
            }}
          >
            <OperationPanel />
          </div>
        ) : null}
        <Background />
      </div>
    );
  }
}

export default Reader;
