//header 页面
import React from "react";
import "./header.css";
import SearchBox from "../../components/searchBox";
import ImportLocal from "../../components/importLocal";
import { Trans } from "react-i18next";

import i18n from "../../i18n";
import About from "../../components/about";
import { HeaderProps, HeaderState } from "./interface";
class Header extends React.Component<HeaderProps, HeaderState> {
  constructor(props: HeaderProps) {
    super(props);
    this.state = {
      isOnlyLocal: false,
      isDownload: localStorage.getItem("isDownload") === "yes" ? true : false,
      isChinese: localStorage.getItem("lang") === "cn",
    };
  }
  componentDidMount() {
    const lng = localStorage.getItem("lang");
    if (lng) {
      i18n.changeLanguage(lng);
      this.setState({ isChinese: !this.state.isChinese });
    }
  }
  changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    this.setState({ isChinese: !this.state.isChinese });
    localStorage.setItem("lang", lng);
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
              className="icon-chinese"
              onClick={() => this.changeLanguage("cn")}
            ></span>
          ) : (
            <span
              className="icon-english"
              onClick={() => this.changeLanguage("en")}
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

export default Header;
