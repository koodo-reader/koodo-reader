import React from "react";
import "./header.css";
import SearchBox from "../../components/searchBox";
import ImportLocal from "../../components/importLocal";
import { Trans } from "react-i18next";
import { HeaderProps, HeaderState } from "./interface";
import StorageUtil from "../../utils/storageUtil";
import UpdateInfo from "../../components/dialogs/updateInfo";
import { restore } from "../../utils/syncUtils/restoreUtil";
import { backup } from "../../utils/syncUtils/backupUtil";
import { Tooltip } from "react-tippy";
import { isElectron } from "react-device-detect";
import { syncData } from "../../utils/syncUtils/common";
import toast from "react-hot-toast";
class Header extends React.Component<HeaderProps, HeaderState> {
  constructor(props: HeaderProps) {
    super(props);

    this.state = {
      isOnlyLocal: false,
      language: StorageUtil.getReaderConfig("lang"),
      isNewVersion: false,
      width: document.body.clientWidth,
      isdataChange: false,
    };
  }
  componentDidMount() {
    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const { ipcRenderer } = window.require("electron");
      const dirPath = ipcRenderer.sendSync("user-data", "ping");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
        fs.mkdirSync(path.join(dirPath, "data"));
        fs.mkdirSync(path.join(dirPath, "data", "book"));
        console.log("文件夹创建成功");
      } else {
        console.log("文件夹已存在");
      }

      if (
        StorageUtil.getReaderConfig("storageLocation") &&
        !localStorage.getItem("storageLocation")
      ) {
        localStorage.setItem(
          "storageLocation",
          StorageUtil.getReaderConfig("storageLocation")
        );
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
      fs.readFile(sourcePath, "utf8", (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        const readerConfig = JSON.parse(data);
        if (
          localStorage.getItem("lastSyncTime") &&
          parseInt(readerConfig.lastSyncTime) >
            parseInt(localStorage.getItem("lastSyncTime")!)
        ) {
          this.setState({ isdataChange: true });
        }
      });
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
    let result = await restore(fileTemp, true);
    if (result) {
      this.setState({ isdataChange: false });
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

      fs.readFile(sourcePath, "utf8", (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        const readerConfig = JSON.parse(data);
        if (localStorage.getItem("lastSyncTime") && readerConfig.lastSyncTime) {
          localStorage.setItem("lastSyncTime", readerConfig.lastSyncTime);
        }
      });
    }
    if (!result) {
      toast.error(this.props.t("Sync Failed"));
    } else {
      toast.success(this.props.t("Sync Successfully"));
    }
  };
  handleSync = () => {
    if (StorageUtil.getReaderConfig("isFirst") !== "no") {
      this.props.handleTipDialog(true);
      this.props.handleTip(
        "You need to manually change the storage location to the same sync folder on different computers. When you click the sync button, Koodo Reader will automatically upload or download the data from this folder according the timestamp."
      );
      StorageUtil.setReaderConfig("isFirst", "no");
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
    fs.readFile(sourcePath, "utf8", async (err, data) => {
      if (err || !data) {
        this.syncToLocation();
      }
      const readerConfig = JSON.parse(data);

      if (
        readerConfig &&
        localStorage.getItem("lastSyncTime") &&
        parseInt(readerConfig.lastSyncTime) >
          parseInt(localStorage.getItem("lastSyncTime")!)
      ) {
        this.syncFromLocation();
      } else {
        //否则就把Koodo中数据同步到同步文件夹
        this.syncToLocation();
      }
    });
  };
  syncToLocation = async () => {
    let timestamp = new Date().getTime().toString();
    StorageUtil.setReaderConfig("lastSyncTime", timestamp);
    localStorage.setItem("lastSyncTime", timestamp);
    let result = await backup(
      this.props.books,
      this.props.notes,
      this.props.bookmarks,
      true
    );
    if (!result) {
      toast.error(this.props.t("Sync Failed"));
    } else {
      syncData(result as Blob, this.props.books, true);
      toast.success(this.props.t("Sync Successfully"));
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
              distance={20}
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
              <span
                className="icon-setting setting-icon"
                style={
                  this.props.isNewWarning ? { color: "rgb(35, 170, 242)" } : {}
                }
              ></span>
            </Tooltip>
          </div>
          {isElectron && (
            <div
              className="setting-icon-container"
              onClick={() => {
                // this.syncFromLocation();
                this.handleSync();
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
        {isElectron && <UpdateInfo />}
      </div>
    );
  }
}

export default Header;
