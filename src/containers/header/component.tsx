//header 页面
import React from "react";
import "./header.css";
import SearchBox from "../../components/searchBox";
import ImportLocal from "../../components/importLocal";
import { Trans, NamespacesConsumer } from "react-i18next";
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
          },
          5,
          () => {}
        );
      },
      true
    );
  };
  syncToLocation = () => {
    const fs = window.require("fs");
    const path = window.require("path");
    let storageLocation = localStorage.getItem("storageLocation")
      ? localStorage.getItem("storageLocation")
      : window
          .require("electron")
          .ipcRenderer.sendSync("storage-location", "ping");
    let sourcePath = path.join(storageLocation, "config", "readerConfig.json");
    try {
      const readerConfig = JSON.parse(
        fs.readFileSync(sourcePath, { encoding: "utf8", flag: "r" })
      );
      //如果同步文件夹的记录较新，就从同步文件夹同步数据到Koodo
      if (
        localStorage.getItem("lastSyncTime") &&
        parseInt(readerConfig.lastSyncTime) >
          parseInt(localStorage.getItem("lastSyncTime")!)
      ) {
        console.log(1);
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
    }
  };

  render() {
    return (
      <div className="header">
        <div className="header-search-container">
          <SearchBox />
        </div>
        <NamespacesConsumer>
          {(t) => (
            <>
              <div
                className="setting-icon-container"
                onClick={() => {
                  this.props.handleSortDisplay(!this.props.isSortDisplay);
                }}
                style={{ left: "490px", top: "18px" }}
              >
                <Tooltip title={t("Sort")} position="top" trigger="mouseenter">
                  <span className="icon-sort-desc header-sort-icon"></span>
                </Tooltip>
              </div>
              <div
                className="setting-icon-container"
                onClick={() => {
                  this.props.handleAbout(!this.props.isAboutOpen);
                }}
              >
                <Tooltip
                  title={t("Setting")}
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
                    title={t("Sync")}
                    position="top"
                    trigger="mouseenter"
                  >
                    <span className="icon-sync setting-icon"></span>
                  </Tooltip>
                </div>
              )}
            </>
          )}
        </NamespacesConsumer>

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
            <NamespacesConsumer>
              {(t) => (
                <Tooltip
                  title={t("Backup and Restore")}
                  position="top"
                  trigger="mouseenter"
                >
                  <span
                    className="icon-save"
                    style={{ fontSize: "18px", fontWeight: 500 }}
                  ></span>
                </Tooltip>
              )}
            </NamespacesConsumer>
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
