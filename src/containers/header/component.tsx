import React from "react";
import "./header.css";
import SearchBox from "../../components/searchBox";
import ImportLocal from "../../components/importLocal";
import { HeaderProps, HeaderState } from "./interface";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import UpdateInfo from "../../components/dialogs/updateDialog";
import { restoreFromConfigJson } from "../../utils/file/restore";
import { backupToConfigJson } from "../../utils/file/backup";
import { isElectron } from "react-device-detect";
import {
  getLastSyncTimeFromConfigJson,
  upgradeConfig,
  upgradeStorage,
} from "../../utils/file/common";
import toast from "react-hot-toast";
import { Trans } from "react-i18next";
import { addChatbox } from "../../utils/common";
import { getThirdpartyRequest } from "../../utils/request/thirdparty";
import { SyncHelper } from "../../assets/lib/kookit-extra-browser.min";
import ConfigUtil from "../../utils/file/configUtil";
import DatabaseService from "../../utils/storage/databaseService";
import SyncService from "../../utils/storage/syncService";
import CoverUtil from "../../utils/file/coverUtil";
import BookUtil from "../../utils/file/bookUtil";
class Header extends React.Component<HeaderProps, HeaderState> {
  constructor(props: HeaderProps) {
    super(props);

    this.state = {
      isOnlyLocal: false,
      language: ConfigService.getReaderConfig("lang"),
      isNewVersion: false,
      width: document.body.clientWidth,
      isdataChange: false,
      isDeveloperVer: false,
    };
  }
  async componentDidMount() {
    this.props.handleFetchAuthed();
    this.props.handleFetchDefaultSyncOption();
    this.props.handleFetchDataSourceList();

    // isElectron &&
    //   (await window.require("electron").ipcRenderer.invoke("s3-download"));
    // let syncUtil = new window.KookitSync.SyncUtil("dropbox", {});
    // console.log(syncUtil, window.KookitSync.SyncUtil);
    // console.log(await syncUtil.listFiles("book"));
    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const { ipcRenderer } = window.require("electron");
      const dirPath = ipcRenderer.sendSync("user-data", "ping");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(path.join(dirPath, "data", "book"), { recursive: true });
        console.log("folder created");
      } else {
        console.log("folder exist");
      }

      if (
        ConfigService.getReaderConfig("storageLocation") &&
        !localStorage.getItem("storageLocation")
      ) {
        localStorage.setItem(
          "storageLocation",
          ConfigService.getReaderConfig("storageLocation")
        );
      }

      if (ConfigService.getReaderConfig("appInfo") === "dev") {
        this.setState({ isDeveloperVer: true });
      }

      //Check for data update
      //upgrade data from old version
      let res1 = await upgradeStorage(this.handleFinishUpgrade);
      let res2 = upgradeConfig();
      if (!res1 || !res2) {
        toast.error("Upgrade failed");
      }

      //Detect data modification
      let lastSyncTime = getLastSyncTimeFromConfigJson();
      if (
        localStorage.getItem("lastSyncTime") &&
        lastSyncTime > parseInt(localStorage.getItem("lastSyncTime") || "0")
      ) {
        this.setState({ isdataChange: true });
      }
    } else {
      upgradeConfig();
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
  UNSAFE_componentWillReceiveProps(
    nextProps: Readonly<HeaderProps>,
    nextContext: any
  ): void {
    if (nextProps.isAuthed) {
      addChatbox();
    }
  }
  handleFinishUpgrade = () => {
    setTimeout(() => {
      this.props.history.push("/manager/home");
    }, 1000);
  };

  syncFromLocation = async () => {
    let result = await restoreFromConfigJson();
    if (result) {
      this.setState({ isdataChange: false });
      //Check for data update
      let lastSyncTime = getLastSyncTimeFromConfigJson();
      if (localStorage.getItem("lastSyncTime") && lastSyncTime) {
        localStorage.setItem("lastSyncTime", lastSyncTime + "");
      }
    }
    if (!result) {
      toast.error(this.props.t("Sync Failed"));
    } else {
      toast.success(this.props.t("Synchronisation successful"));
    }
  };
  handleLocalSync = () => {
    if (ConfigService.getReaderConfig("isFirst") !== "no") {
      this.props.handleTipDialog(true);
      this.props.handleTip(
        "Sync function works with third-party cloud drive. You need to manually change the storage location to the same sync folder on different computers. When you click the sync button, Koodo Reader will automatically upload or download the data from this folder according the timestamp."
      );
      ConfigService.setReaderConfig("isFirst", "no");
      return;
    }
    let lastSyncTime = getLastSyncTimeFromConfigJson();
    if (
      localStorage.getItem("lastSyncTime") &&
      lastSyncTime > parseInt(localStorage.getItem("lastSyncTime")!)
    ) {
      this.syncFromLocation();
    } else {
      this.syncToLocation();
    }
  };
  handleFinish = async () => {
    let thirdpartyRequest = await getThirdpartyRequest();
    let deleteSyncResult = await thirdpartyRequest.deleteSyncState();
    if (deleteSyncResult.code !== 200) {
      toast.error(this.props.t("Failed to delete sync state"));
    }
  };
  beforeSync = async () => {
    console.log(this.props.defaultSyncOption, "defaultSyncOption");
    if (!this.props.defaultSyncOption) {
      toast.error(
        this.props.t("Please set default sync option in the setting")
      );
      return false;
    }
    let thirdpartyRequest = await getThirdpartyRequest();
    let getSyncResult = await thirdpartyRequest.getSyncState();
    if (getSyncResult.code !== 200) {
      toast.error(this.props.t("Failed to get sync state"));
      await this.handleFinish();
      return false;
    }
    if (!getSyncResult.data) {
      toast.error(
        this.props.t(
          "Sync state is occupied by other devices, please try again later"
        )
      );
      await this.handleFinish();
      return false;
    }
    toast.loading(this.props.t("Start syncing") + "...", { id: "syncing-id" });
    return true;
  };
  getCompareResult = async () => {
    let result = await ConfigUtil.downloadConfig("sync");
    let cloudSyncRecords = JSON.parse(result ? result : "{}");
    let localSyncRecords = ConfigService.getAllSyncRecord();
    console.log(localSyncRecords, cloudSyncRecords);
    return await SyncHelper.compareAll(localSyncRecords, cloudSyncRecords);
  };
  handleCloudSync = async () => {
    let res = await this.beforeSync();
    if (!res) {
      return;
    }
    let { compareResult, syncRecords } = await this.getCompareResult();
    ConfigService.setAllSyncRecord(syncRecords);
    await this.handleSync(compareResult);
  };
  handleSuccess = async () => {
    this.props.handleFetchBooks();
    this.props.handleFetchBookmarks();
    this.props.handleFetchNotes();
    toast.success(this.props.t("Synchronisation successful"), {
      id: "syncing-id",
    });
    setTimeout(() => {
      this.props.history.push("/manager/home");
    }, 1000);
  };
  handleSync = async (compareResult) => {
    await SyncHelper.startSync(
      compareResult,
      ConfigService,
      DatabaseService,
      ConfigUtil,
      BookUtil,
      CoverUtil
    );
    console.log("sync finish");
    await this.handleFinish();
    console.log("sync finish2");
    await this.handleSuccess();
  };
  syncToLocation = async () => {
    let timestamp = new Date().getTime().toString();
    ConfigService.setReaderConfig("lastSyncTime", timestamp);
    localStorage.setItem("lastSyncTime", timestamp);
    backupToConfigJson();
    toast.success(this.props.t("Synchronisation successful"));
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

          <div
            className="setting-icon-container"
            onClick={() => {
              if (!isElectron && !this.props.isAuthed) {
                toast(
                  this.props.t(
                    "This feature is not available in the free version"
                  )
                );
              }
              if (this.props.isAuthed) {
                this.handleCloudSync();
              } else {
                this.handleLocalSync();
              }
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
                  this.state.isdataChange ? { color: "rgb(35, 170, 242)" } : {}
                }
              ></span>
            </span>
          </div>
        </div>

        {!this.props.isAuthed ? (
          <div
            className="header-report-container"
            onClick={() => {
              this.props.history.push("/login");
            }}
          >
            <Trans>Pro version</Trans>
          </div>
        ) : null}

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
