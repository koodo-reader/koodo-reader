//header 页面
import React from "react";
import "./header.css";
import { connect } from "react-redux";
import SearchBox from "../searchBox/searchBox";
import ImportLocal from "../importLocal/importLocal";
import { Trans, withNamespaces } from "react-i18next";
import {
  handleSortDisplay,
  handleMessageBox,
  handleMessage,
} from "../../redux/actions/manager";

import i18n from "../../i18n";
import { handleBackupDialog } from "../../redux/actions/backupPage";
import BookModel from "../../model/Book";
import { stateType } from "../../redux/store";
import About from "../about/about";

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
  isChinese: boolean;
}

class Header extends React.Component<HeaderProps, HeaderState> {
  constructor(props: HeaderProps) {
    super(props);
    this.state = {
      isOnlyLocal: false,
      isDownload: localStorage.getItem("isDownload") === "yes" ? true : false,
      isChinese: true,
    };
  }
  changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    this.setState({ isChinese: !this.state.isChinese });
  };
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
          <span className="header-sort-text">
            <Trans>Sort</Trans>
          </span>
          <span className="icon-sort header-sort-icon"></span>
        </div>
        <div className="change-language">
          {this.state.isChinese ? (
            <span
              className="icon-english"
              onClick={() => this.changeLanguage("en")}
            ></span>
          ) : (
            <span
              className="icon-chinese"
              onClick={() => this.changeLanguage("cn")}
            ></span>
          )}
        </div>
        <a href="/assets/demo.epub" target="_blank" rel="noopener noreferrer">
          <div
            className="download-demo-book"
            onClick={this.handleDownload.bind(this)}
            style={this.state.isDownload ? { color: "rgba(75,75,75,0.8)" } : {}}
          >
            <Trans>Download Demo Book</Trans>
          </div>
        </a>
        <About />

        <div
          className="import-from-cloud"
          onClick={() => {
            this.props.handleBackupDialog(true);
          }}
        >
          <Trans>Backup and Restore</Trans>
        </div>
        <ImportLocal />
      </div>
    );
  }
}
const mapStateToProps = (state: stateType) => {
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
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(Header as any));
