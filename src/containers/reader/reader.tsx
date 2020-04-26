import React from "react";
import ViewArea from "../../components/viewArea/viewArea";
import Background from "../../components/background/background";
import SettingPanel from "../../components/settingPanel/settingPanel";
import NavigationPanel from "../../components/navigationPanel/navigationPanel";
import OperationPanel from "../../components/operationPanel/operationPanel";
import MessageBox from "../../components/messageBox/messageBox";
import ProgressPanel from "../../components/progressPanel/progressPanel";
import {
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchDigests,
  handleFetchChapters,
  handleFetchHighlighters,
} from "../../redux/reader.redux";
import { handleFetchPercentage } from "../../redux/progressPanel.redux";
import { handleMessageBox } from "../../redux/manager.redux";
import "./reader.css";
import { connect } from "react-redux";
import BookModel from "../../model/Book"; import { stateType } from "../../store";

export interface ReaderProps {
  currentEpub: any;
  currentBook: BookModel;
  isMessage: boolean;
  handleFetchNotes: () => void;
  handleFetchDigests: () => void;
  handleFetchBookmarks: () => void;
  handleFetchHighlighters: () => void;
  handleMessageBox: (isShow: boolean) => void;
  handleFetchPercentage: (currentBook: BookModel) => void;
  handleFetchChapters: (currentEpub: any) => void;
}

export interface ReaderState {
  isOpenSettingPanel: boolean;
  isOpenOperationPanel: boolean;
  isOpenProgressPanel: boolean;
  isOpenInfoPanel: boolean;
  isMessage: boolean;
}

class Reader extends React.Component<ReaderProps, ReaderState> {
  timer!: NodeJS.Timeout;
  constructor(props:ReaderProps) {
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
    this.props.handleFetchHighlighters();
    this.props.handleFetchChapters(this.props.currentEpub);
  }
  UNSAFE_componentWillReceiveProps(nextProps:ReaderProps) {
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
  // 为state的属性设置相应的值
  // setConfig(key, value) {
  //   this.setState({ [key]: value });
  // }
  //进入阅读器
  handleEnterReader = (position:string) => {
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
  handleLeaveReader = (event:any, position: string) => {
    //控制上下左右的菜单的显示
    switch (position) {
      case "right": {
        if (event.clientX < document.body.offsetWidth - 282) {
          this.setState({
            isOpenSettingPanel: false,
          });
        }
        break;
      }
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
const mapStateToProps = (state:stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    isMessage: state.manager.isMessage,
  };
};
const actionCreator = {
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchDigests,
  handleFetchChapters,
  handleFetchHighlighters,
  handleMessageBox,
  handleFetchPercentage,
};
export default connect(mapStateToProps, actionCreator)(Reader);
