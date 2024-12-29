import React from "react";
import "./header.css";
import SearchBox from "../../components/searchBox";
import ImportLocal from "../../components/importLocal";
import { HeaderProps, HeaderState } from "./interface";
import StorageUtil from "../../utils/serviceUtils/storageUtil";
import UpdateInfo from "../../components/dialogs/updateDialog";
import { restore } from "../../utils/syncUtils/restoreUtil";
import { backup } from "../../utils/syncUtils/backupUtil";
import { isElectron } from "react-device-detect";
import { syncData } from "../../utils/syncUtils/common";
import toast from "react-hot-toast";
import { Trans } from "react-i18next";
class Header extends React.Component<HeaderProps, HeaderState> {
  constructor(props: HeaderProps) {
    super(props);

    this.state = {
      isOnlyLocal: false,
      language: StorageUtil.getReaderConfig("lang"),
      isNewVersion: false,
      width: document.body.clientWidth,
      isdataChange: false,
      isDeveloperVer: false,
    };
  }
  async componentDidMount() {
    // isElectron &&
    //   (await window.require("electron").ipcRenderer.invoke("s3-download"));
    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const { ipcRenderer } = window.require("electron");
      const dirPath = ipcRenderer.sendSync("user-data", "ping");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
        fs.mkdirSync(path.join(dirPath, "data"));
        fs.mkdirSync(path.join(dirPath, "data", "book"));
        console.log("folder created");
      } else {
        console.log("folder exist");
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

      if (StorageUtil.getReaderConfig("appInfo") === "dev") {
        this.setState({ isDeveloperVer: true });
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
          console.log(err);
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
    window.addEventListener("focus", () => {
      this.props.handleFetchBooks();
      this.props.handleFetchNotes();
      this.props.handleFetchBookmarks();
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
          console.log(err);
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
      toast.success(this.props.t("Synchronisation successful"));
    }
  };
  handleSync = () => {
    if (StorageUtil.getReaderConfig("isFirst") !== "no") {
      this.props.handleTipDialog(true);
      this.props.handleTip(
        "Sync function works with third-party cloud drive. You need to manually change the storage location to the same sync folder on different computers. When you click the sync button, Koodo Reader will automatically upload or download the data from this folder according the timestamp."
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
        return;
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
      toast.success(this.props.t("Synchronisation successful"));
    }
  };

  render() {
    return (
      <div
        className="header"
        style={this.props.isCollapsed ? { marginLeft: "40px" } : {}}
      >
        <div
          className="header-search-container"
          style={this.props.isCollapsed ? { width: "369px" } : {}}
        >
          <SearchBox />
        </div>
        <div
          className="setting-icon-parrent"
          style={this.props.isCollapsed ? { marginLeft: "430px" } : {}}
        >
          <div
            className="setting-icon-container"
            onClick={() => {
              this.props.handleSortDisplay(!this.props.isSortDisplay);
            }}
            onMouseLeave={() => {
              this.props.handleSortDisplay(false);
            }}
            style={{ top: "18px" }}
          >
            <span
              data-tooltip-id="my-tooltip"
              data-tooltip-content={this.props.t("Sort by")}
            >
              <span className="icon-sort-desc header-sort-icon"></span>
            </span>
          </div>
          <div
            className="setting-icon-container"
            onClick={() => {
              this.props.handleAbout(!this.props.isAboutOpen);
            }}
            onMouseLeave={() => {
              this.props.handleAbout(false);
            }}
            style={{ marginTop: "2px" }}
          >
            <span
              data-tooltip-id="my-tooltip"
              data-tooltip-content={this.props.t("Setting")}
            >
              <span
                className="icon-setting setting-icon"
                style={
                  this.props.isNewWarning ? { color: "rgb(35, 170, 242)" } : {}
                }
              ></span>
            </span>
          </div>
          <div
            className="setting-icon-container"
            onClick={() => {
              this.props.handleBackupDialog(true);
            }}
            onMouseLeave={() => {
              this.props.handleSortDisplay(false);
            }}
            style={{ marginTop: "1px" }}
          >
            <span
              data-tooltip-id="my-tooltip"
              data-tooltip-content={this.props.t("Backup")}
            >
              <span className="icon-archive header-archive-icon"></span>
            </span>
          </div>
          {isElectron && (
            <div
              className="setting-icon-container"
              onClick={() => {
                // this.syncFromLocation();
                this.handleSync();
              }}
              style={{ marginTop: "2px" }}
            >
              <span
                data-tooltip-id="my-tooltip"
                data-tooltip-content={this.props.t("Sync")}
              >
                <span
                  className="icon-sync setting-icon"
                  style={
                    this.state.isdataChange
                      ? { color: "rgb(35, 170, 242)" }
                      : {}
                  }
                ></span>
              </span>
            </div>
          )}
        </div>
        {this.state.isDeveloperVer && (
          <div
            className="header-report-container"
            onClick={() => {
              this.props.handleFeedbackDialog(true);
            }}
          >
            <Trans>Report</Trans>
          </div>
        )}
        <ImportLocal
          {...{
            handleDrag: this.props.handleDrag,
          }}
        />
        <UpdateInfo />
      </div>
    );
  }
}

export default Header;
