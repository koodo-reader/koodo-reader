//header 页面
import React from "react";
import "./header.css";
import { connect } from "react-redux";
import SearchBox from "../searchBox/searchBox";
import ImportLocal from "../importLocal/importLocal";
import About from "../about/about";
import {
  handleSortDisplay,
  handleMessageBox,
  handleMessage,
} from "../../redux/manager.redux";
import { handleBackupDialog } from "../../redux/backupPage.redux";
import BookModel from "../../model/Book";
export interface HeaderProps {
  books: BookModel[];
  isSearch: boolean;
  isSortDisplay: boolean;
  handleSortDisplay: (isSort: boolean) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleBackupDialog: (isBackup: boolean) => void;
}

export interface HeaderState {
  isOnlyLocal: boolean;
  isDownload: boolean;
}

class Header extends React.Component<HeaderProps, HeaderState> {
  constructor(props) {
    super(props);
    this.state = {
      isOnlyLocal: false,
      isDownload: localStorage.getItem("isDownload") === "yes" ? true : false,
    };
  }
  handleSortBooks = () => {
    if (this.props.isSortDisplay) {
      this.props.handleSortDisplay(false);
    } else {
      this.props.handleSortDisplay(true);
    }
  };
  handleOnlyLocal = () => {
    this.setState({ isOnlyLocal: !this.state.isOnlyLocal });
    this.props.handleMessage("下载客户端体验完整功能");
    this.props.handleMessageBox(true);
  };
  handleDownload = () => {
    this.setState({ isDownload: true });
    localStorage.setItem("isDownload", "yes");
  };
  render() {
    return (
      <div className="header">
        <SearchBox />
        <div
          className="header-sort-container"
          onClick={() => {
            this.handleSortBooks();
          }}
        >
          <span className="header-sort-text">排序</span>
          <span className="icon-sort header-sort-icon"></span>
        </div>
        <About />
        <a
          href="/koodo-web/assets/demo.epub"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div
            className="download-demo-book"
            onClick={this.handleDownload.bind(this)}
            style={this.state.isDownload ? { color: "rgba(75,75,75,0.8)" } : {}}
          >
            下载示例图书
          </div>
        </a>

        <ImportLocal />
        <div
          className="import-from-cloud"
          onClick={() => {
            this.props.handleBackupDialog(true);
          }}
        >
          备份和恢复
        </div>
      </div>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    books: state.manager.books,
    isSearch: state.manager.isSearch,
    isSortDisplay: state.manager.isSortDisplay,
  };
};
const actionCreator = {
  handleSortDisplay,
  handleMessageBox,
  handleMessage,
  handleBackupDialog,
};
export default connect(mapStateToProps, actionCreator)(Header);
