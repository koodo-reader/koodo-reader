import React, { Component } from "react";
// import styleConfig from "../../utils/styleConfig";
import ViewArea from "../../components/viewArea/viewArea";
import Background from "../../components/background/background";
import SettingPanel from "../../components/settingPanel/settingPanel";
import NavigationPanel from "../../components/navigationPanel/navigationPanel";
import OperationPanel from "../../components/operationPanel/operationPanel";
import MessageBox from "../../components/messageBox/messageBox";

import ProgressPanel from "../../components/progressPanel/progressPanel";
import {
  handleNotes,
  handleBookmarks,
  handleDigests,
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchDigests,
  handleFetchChapters,
  handleFetchHighlighters

  // handleLocations
} from "../../redux/reader.redux";
import { handleFetchPercentage } from "../../redux/progressPanel.redux";
import { handleMessageBox } from "../../redux/manager.redux";
import "./reader.css";
import { connect } from "react-redux";
class Reader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpenSettingPanel: false,
      isOpenOperationPanel: false,
      isOpenProgressPanel: false,
      isOpenInfoPanel: false,
      isMessage: false
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
  UNSAFE_componentWillReceiveProps(nextProps) {
    // console.log(nextProps);
    this.setState({
      isMessage: nextProps.isMessage
    });
    if (nextProps.isMessage) {
      this.timer = setTimeout(() => {
        this.props.handleMessageBox(false);
        this.setState({ isMessage: false });
      }, 2000);
    }
    // console.log(this.state.isMessage, "asdgsgjhf");
  }
  componentDidMount() {
    window.rangy.init(); // 初始化
  }
  componentWillUnmount() {
    clearTimeout(this.timer);
  }
  // 为state的属性设置相应的值
  setConfig(key, value) {
    this.setState({ [key]: value });
    // styleConfig.set(key, value);
  }

  handleEnter = position => {
    // console.log("enter");

    switch (position) {
      case "right":
        this.setState({
          isOpenSettingPanel: this.state.isOpenSettingPanel ? false : true
        });
        break;
      case "left":
        this.setState({
          isOpenInfoPanel: this.state.isOpenInfoPanel ? false : true
        });
        break;
      case "top":
        this.setState({
          isOpenOperationPanel: this.state.isOpenOperationPanel ? false : true
        });
        break;
      case "bottom":
        this.setState({
          isOpenProgressPanel: this.state.isOpenProgressPanel ? false : true
        });
        break;
      default:
        break;
    }
    // this.setState({ isOpenSettingPanel: true });
  };
  handleLeave = (event, position) => {
    switch (position) {
      case "right": {
        if (event.clientX < document.body.offsetWidth - 282) {
          this.setState({
            isOpenSettingPanel: false
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
    // this.setState({ isOpenSettingPanel: false });
  };
  render() {
    return (
      <div className="viewer">
        {this.state.isMessage ? <MessageBox /> : null}

        <div
          className="left-panel"
          onMouseEnter={() => {
            this.handleEnter("left");
          }}
        ></div>
        <div
          className="right-panel"
          onMouseEnter={() => {
            this.handleEnter("right");
          }}
        ></div>
        <div
          className="top-panel"
          onMouseEnter={() => {
            this.handleEnter("top");
          }}
        ></div>
        <div
          className="bottom-panel"
          onMouseEnter={() => {
            this.handleEnter("bottom");
          }}
        ></div>
        <ViewArea className="view-area" />
        {this.state.isOpenSettingPanel ? (
          <div
            onMouseLeave={event => {
              this.handleLeave(event, "right");
            }}
          >
            <SettingPanel className="setting-panel" />
          </div>
        ) : null}
        {this.state.isOpenInfoPanel ? (
          <div
            onMouseLeave={event => {
              this.handleLeave(event, "left");
            }}
          >
            <NavigationPanel className="navigation-panel" />
          </div>
        ) : null}
        {this.state.isOpenProgressPanel ? (
          <div
            className="progress-panel-container"
            onMouseLeave={event => {
              this.handleLeave(event, "bottom");
            }}
          >
            <ProgressPanel className="progress-panel" />
          </div>
        ) : null}
        {this.state.isOpenOperationPanel ? (
          <div
            className="operation-panel-container"
            onMouseLeave={event => {
              this.handleLeave(event, "top");
            }}
          >
            <OperationPanel className="book-operation-panel" />
          </div>
        ) : null}

        <Background className="background" />
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    isMessage: state.manager.isMessage
  };
};
const actionCreator = {
  handleNotes,
  handleBookmarks,
  handleDigests,
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchDigests,
  handleFetchChapters,
  handleFetchHighlighters,
  handleMessageBox,
  handleFetchPercentage
};
Reader = connect(mapStateToProps, actionCreator)(Reader);
export default Reader;
