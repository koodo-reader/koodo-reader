//header 页面
import React from "react";
import "./header.css";
import SearchBox from "../../components/searchBox";
import ImportLocal from "../../components/importLocal";
import { Trans } from "react-i18next";
import { HeaderProps, HeaderState } from "./interface";
import OtherUtil from "../../utils/otherUtil";
import UpdateInfo from "../../components/dialogs/updateInfo";
import RestoreUtil from "../../utils/syncUtils/restoreUtil";
import BackupUtil from "../../utils/syncUtils/backupUtil";
import { Tooltip } from "react-tippy";
import { isElectron } from "react-device-detect";
class Header extends React.Component<HeaderProps, HeaderState> {
  constructor(props: HeaderProps) {
    super(props);

    this.state = {
      isOnlyLocal: false,
      language: OtherUtil.getReaderConfig("lang"),
      isNewVersion: false,
      width: document.body.clientWidth,
      isdataChange: false,
    };
  }
  async componentDidMount() {
    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const request = window.require("request");
      const { remote, app } = window.require("electron");
      const configDir = (app || remote.app).getPath("userData");
      const dirPath = path.join(configDir, "uploads");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
        fs.mkdirSync(path.join(dirPath, "data"));
        fs.mkdirSync(path.join(dirPath, "data", "book"));
        console.log("文件夹创建成功");
      } else {
        console.log("文件夹已存在");
      }

      if (
        OtherUtil.getReaderConfig("storageLocation") &&
        !localStorage.getItem("storageLocation")
      ) {
        localStorage.setItem(
          "storageLocation",
          OtherUtil.getReaderConfig("storageLocation")
        );
      }
      if (!fs.existsSync(path.join(dirPath, `cover.png`))) {
        let stream = fs.createWriteStream(path.join(dirPath, `cover.png`));
        request(`https://koodo.960960.xyz/images/splash.png`)
          .pipe(stream)
          .on("close", function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log("文件下载完毕");
            }
          });
      }
      //Check for data update
      let storageLocation = localStorage.getItem("storageLocation")
        ? localStorage.getItem("storageLocation")
        : window
            .require("electron")
            .ipcRenderer.sendSync("storage-location", "ping");
      let sourcePath = path.join(
        storageLocation,
        "config",
        "readerConfig.json"
      );
      //Detect data modification
      try {
        const readerConfig = JSON.parse(
          fs.readFileSync(sourcePath, { encoding: "utf8", flag: "r" })
        );
        if (
          localStorage.getItem("lastSyncTime") &&
          parseInt(readerConfig.lastSyncTime) >
            parseInt(localStorage.getItem("lastSyncTime")!)
        ) {
          this.setState({ isdataChange: true });
        }
      } catch (error) {
        throw error;
      }
    }

    window.addEventListener("resize", () => {
      this.setState({ width: document.body.clientWidth });
    });
  }

  syncFromLocation = async () => {
    const fs = window.require("fs");
    const path = window.require("path");
    const { zip } = window.require("zip-a-folder");
    let storageLocation = localStorage.getItem("storageLocation")
      ? localStorage.getItem("storageLocation")
      : window
          .require("electron")
          .ipcRenderer.sendSync("storage-location", "ping");
    let sourcePath = path.join(storageLocation, "config");
    let outPath = path.join(storageLocation, "config.zip");
    await zip(sourcePath, outPath);

    var data = fs.readFileSync(outPath);

    let blobTemp = new Blob([data], { type: "application/epub+zip" });
    let fileTemp = new File([blobTemp], "config.zip", {
      lastModified: new Date().getTime(),
      type: blobTemp.type,
    });

    RestoreUtil.restore(
      fileTemp,
      () => {
        BackupUtil.backup(
          this.props.books,
          this.props.notes,
          this.props.bookmarks,
          () => {
            this.props.handleMessage("Sync Successfully");
            this.props.handleMessageBox(true);
            this.setState({ isdataChange: false });
          },
          5,
          () => {}
        );
      },
      true
    );
  };
  syncToLocation = () => {
    if (OtherUtil.getReaderConfig("isFirst") !== "no") {
      this.props.handleTipDialog(true);
      this.props.handleTip(
        "You need to manually change the storage location to the same sync folder on different computers. When you click the sync button, Koodo Reader will automatically upload or download the data from this folder according the timestamp."
      );
      OtherUtil.setReaderConfig("isFirst", "no");
      return;
    }
    const fs = window.require("fs");
    const path = window.require("path");
    let storageLocation = localStorage.getItem("storageLocation")
      ? localStorage.getItem("storageLocation")
      : window
          .require("electron")
          .ipcRenderer.sendSync("storage-location", "ping");
    let sourcePath = path.join(storageLocation, "config", "readerConfig.json");
    let readerConfig: any;
    try {
      readerConfig = JSON.parse(
        fs.readFileSync(sourcePath, { encoding: "utf8", flag: "r" })
      );
    } catch (error) {
      BackupUtil.backup(
        this.props.books,
        this.props.notes,
        this.props.bookmarks,
        () => {
          this.props.handleMessage("Sync Successfully");
          this.props.handleMessageBox(true);
        },
        5,
        () => {}
      );
      return;
    }
    //如果同步文件夹的记录较新，就从同步文件夹同步数据到Koodo

    if (
      readerConfig &&
      localStorage.getItem("lastSyncTime") &&
      parseInt(readerConfig.lastSyncTime) >
        parseInt(localStorage.getItem("lastSyncTime")!)
    ) {
      this.syncFromLocation();
    } else {
      //否则就把Koodo中数据同步到同步文件夹
      BackupUtil.backup(
        this.props.books,
        this.props.notes,
        this.props.bookmarks,
        () => {
          this.props.handleMessage("Sync Successfully");
          this.props.handleMessageBox(true);
        },
        5,
        () => {}
      );
    }
  };

  render() {
    return (
      <div className="header">
        <div className="header-search-container">
          <SearchBox />
        </div>

        <>
          <div
            className="setting-icon-container"
            onClick={() => {
              this.props.handleSortDisplay(!this.props.isSortDisplay);
            }}
            onMouseLeave={() => {
              this.props.handleSortDisplay(false);
            }}
            style={{ left: "490px", top: "18px" }}
          >
            <Tooltip
              title={this.props.t("Sort")}
              position="top"
              trigger="mouseenter"
            >
              <span className="icon-sort-desc header-sort-icon"></span>
            </Tooltip>
          </div>
          <div
            className="setting-icon-container"
            onClick={() => {
              this.props.handleAbout(!this.props.isAboutOpen);
            }}
            onMouseLeave={() => {
              this.props.handleAbout(false);
            }}
          >
            <Tooltip
              title={this.props.t("Setting")}
              position="top"
              trigger="mouseenter"
            >
              <span className="icon-setting setting-icon"></span>
            </Tooltip>
          </div>
          {isElectron && (
            <div
              className="setting-icon-container"
              onClick={() => {
                this.syncToLocation();
              }}
              style={{ left: "635px" }}
            >
              <Tooltip
                title={this.props.t(
                  this.state.isdataChange
                    ? "Data change detected, whether to update?"
                    : "Sync"
                )}
                position="top"
                trigger="mouseenter"
              >
                <span
                  className="icon-sync setting-icon"
                  style={
                    this.state.isdataChange
                      ? { color: "rgb(35, 170, 242)" }
                      : {}
                  }
                ></span>
              </Tooltip>
            </div>
          )}
        </>

        <div
          className="import-from-cloud"
          onClick={() => {
            this.props.handleBackupDialog(true);
          }}
          style={
            this.props.isCollapsed && document.body.clientWidth < 950
              ? { width: "42px" }
              : {}
          }
        >
          <div className="animation-mask"></div>
          {this.props.isCollapsed && this.state.width < 950 ? (
            <Tooltip
              title={this.props.t("Backup and Restore")}
              position="top"
              trigger="mouseenter"
            >
              <span
                className="icon-share"
                style={{ fontSize: "15px", fontWeight: 600 }}
              ></span>
            </Tooltip>
          ) : (
            <Trans>Backup and Restore</Trans>
          )}
        </div>
        <ImportLocal
          {...{
            handleDrag: this.props.handleDrag,
          }}
        />
        {isElectron &&
          OtherUtil.getReaderConfig("isDisableUpdate") !== "yes" && (
            <UpdateInfo />
          )}
      </div>
    );
  }
}

export default Header;
