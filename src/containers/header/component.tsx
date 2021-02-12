//header 页面
import React from "react";
import "./header.css";
import SearchBox from "../../components/searchBox";
import ImportLocal from "../../components/importLocal";
import { Trans } from "react-i18next";
import { HeaderProps, HeaderState } from "./interface";
import OtherUtil from "../../utils/otherUtil";
import UpdateInfo from "../../components/updateInfo";
import RestoreUtil from "../../utils/syncUtils/restoreUtil";
import BackupUtil from "../../utils/syncUtils/backupUtil";

const isElectron = require("is-electron");

class Header extends React.Component<HeaderProps, HeaderState> {
  constructor(props: HeaderProps) {
    super(props);
    this.state = {
      isOnlyLocal: false,
      language: OtherUtil.getReaderConfig("lang"),
      isNewVersion: false,
    };
  }
  handleSortBooks = () => {
    if (this.props.isSortDisplay) {
      this.props.handleSortDisplay(false);
    } else {
      this.props.handleSortDisplay(true);
    }
  };
  async componentDidMount() {
    if (isElectron()) {
      const fs = window.require("fs");
      const { zip } = window.require("zip-a-folder");
      let storageLocation = OtherUtil.getReaderConfig("storageLocation")
        ? OtherUtil.getReaderConfig("storageLocation")
        : window
            .require("electron")
            .ipcRenderer.sendSync("storage-location", "ping");
      let sourcePath = storageLocation + "\\config";
      let outPath = storageLocation + "\\config.zip";
      await zip(sourcePath, outPath);
      fs.unlink(outPath, (err) => {
        if (err) throw err;
        console.log("successfully config deleted");
      });

      var data = fs.readFileSync(outPath);
      let blobTemp = new Blob([data], { type: "application/epub+zip" });
      let fileTemp = new File([blobTemp], "config.zip", {
        lastModified: new Date().getTime(),
        type: blobTemp.type,
      });

      OtherUtil.getReaderConfig("isAutoSync") === "yes" &&
        RestoreUtil.restore(
          fileTemp,
          () => {
            isElectron() &&
              BackupUtil.backup(
                this.props.books,
                this.props.notes,
                this.props.bookmarks,
                () => {},
                5,
                () => {}
              );
          },
          true
        );
    }
  }
  render() {
    return (
      <div className="header">
        <div className="header-search-container">
          <SearchBox />
        </div>

        <div
          className="header-sort-container"
          onMouseEnter={() => {
            this.handleSortBooks();
          }}
        >
          <span className="header-sort-text">
            <Trans>Sort</Trans>
          </span>
          <span className="icon-sort header-sort-icon"></span>
        </div>
        <div className="setting-icon-container">
          <span
            className="icon-setting setting-icon"
            onClick={() => {
              this.props.handleSetting(true);
            }}
          ></span>
        </div>

        <div
          className="import-from-cloud"
          onClick={() => {
            this.props.handleBackupDialog(true);
          }}
        >
          <div className="animation-mask"></div>
          <Trans>Backup and Restore</Trans>
        </div>
        <ImportLocal {...{ handleDrag: this.props.handleDrag }} />
        {isElectron() && <UpdateInfo />}
      </div>
    );
  }
}

export default Header;
