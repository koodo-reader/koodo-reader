//header 页面
import React from "react";
import "./header.css";
import SearchBox from "../../components/searchBox";
import ImportLocal from "../../components/importLocal";
import { Trans } from "react-i18next";
import i18n from "../../i18n";
import { HeaderProps, HeaderState } from "./interface";
import OtherUtil from "../../utils/otherUtil";
import UpdateInfo from "../../components/updateInfo";

class Header extends React.Component<HeaderProps, HeaderState> {
  constructor(props: HeaderProps) {
    super(props);
    this.state = {
      isOnlyLocal: false,
      isBookImported:
        OtherUtil.getReaderConfig("totalBooks") &&
        OtherUtil.getReaderConfig("totalBooks") > 0
          ? true
          : false,
      language: OtherUtil.getReaderConfig("lang"),
      isNewVersion: false,
    };
  }
  componentDidMount() {
    const lng = OtherUtil.getReaderConfig("lang");
    if (lng) {
      i18n.changeLanguage(lng);
      this.setState({ language: lng });
    }
  }
  changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    this.setState({ language: lng });
    OtherUtil.setReaderConfig("lang", lng);
  };
  handleSortBooks = () => {
    if (this.props.isSortDisplay) {
      this.props.handleSortDisplay(false);
    } else {
      this.props.handleSortDisplay(true);
    }
  };

  render() {
    return (
      <div className="header">
        <div className="header-search-container">
          <SearchBox />
        </div>

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
          {this.state.language === "cht" ? (
            <span
              className="icon-english"
              onClick={() => this.changeLanguage("en")}
            ></span>
          ) : this.state.language === "en" ? (
            <span
              className="icon-simplified"
              onClick={() => this.changeLanguage("zh")}
            ></span>
          ) : (
            <span
              className="icon-traditional"
              onClick={() => this.changeLanguage("cht")}
            ></span>
          )}
        </div>
        <a href="/assets/demo.epub" target="_blank" rel="noopener noreferrer">
          <div
            className="download-demo-book"
            style={this.state.isBookImported ? { display: "none" } : {}}
          >
            <Trans>Download Demo Book</Trans>
          </div>
        </a>
        <div
          className="import-from-cloud"
          onClick={() => {
            this.props.handleBackupDialog(true);
          }}
        >
          <Trans>Backup and Restore</Trans>
        </div>
        <ImportLocal />
        <UpdateInfo />
      </div>
    );
  }
}

export default Header;
