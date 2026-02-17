import React from "react";
import "./header.css";
import SearchBox from "../../components/searchBox";
import ImportLocal from "../../components/importLocal";
import { HeaderProps, HeaderState } from "./interface";
import {
  ConfigService,
  KookitConfig,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import UpdateInfo from "../../components/dialogs/updateDialog";
import { restoreFromConfigJson } from "../../utils/file/restore";
import { backupToConfigJson, generateSnapshot } from "../../utils/file/backup";
import { isElectron } from "react-device-detect";
import {
  getCloudConfig,
  getLastSyncTimeFromConfigJson,
  removeCloudConfig,
  upgradeConfig,
  upgradeStorage,
} from "../../utils/file/common";
import toast from "react-hot-toast";
import { Trans } from "react-i18next";
import { SyncHelper } from "../../assets/lib/kookit-extra-browser.min";
import ConfigUtil from "../../utils/file/configUtil";
import DatabaseService from "../../utils/storage/databaseService";
import CoverUtil from "../../utils/file/coverUtil";
import BookUtil from "../../utils/file/bookUtil";
import {
  addChatBox,
  checkBrokenData,
  checkMissingBook,
  generateSyncRecord,
  getChatLocale,
  getTaskStats,
  getWebsiteUrl,
  openInBrowser,
  removeChatBox,
  resetKoodoSync,
  showTaskProgress,
  vexComfirmAsync,
} from "../../utils/common";
import { driveList } from "../../constants/driveList";
import SupportDialog from "../../components/dialogs/supportDialog";
import SyncService from "../../utils/storage/syncService";
import { LocalFileManager } from "../../utils/file/localFile";
import packageJson from "../../../package.json";
import { getTempToken, updateUserConfig } from "../../utils/request/user";
declare var window: any;

class Header extends React.Component<HeaderProps, HeaderState> {
  timer: any;
  private isSyncing: boolean = false;
  constructor(props: HeaderProps) {
    super(props);

    this.state = {
      isOnlyLocal: false,
      language: ConfigService.getReaderConfig("lang"),
      isNewVersion: false,
      width: document.body.clientWidth,
      isDataChange: false,
      isHidePro: false,
      isSync: false,
    };
  }
  async componentDidMount() {
    if (isElectron) {
      try {
        await generateSnapshot();
      } catch (error) {
        console.error("Failed to generate snapshot:", error);
      }
    }
    this.props.handleFetchAuthed();
    this.props.handleFetchDefaultSyncOption();
    this.props.handleFetchDataSourceList();
    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const { ipcRenderer } = window.require("electron");
      const dirPath = ipcRenderer.sendSync("user-data", "ping");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(path.join(dirPath, "data", "book"), { recursive: true });
        console.info("folder created");
      } else {
        console.info("folder exist");
      }

      if (
        ConfigService.getReaderConfig("storageLocation") &&
        !ConfigService.getItem("storageLocation")
      ) {
        ConfigService.setItem(
          "storageLocation",
          ConfigService.getReaderConfig("storageLocation")
        );
      }
      if (ConfigService.getReaderConfig("isHidePro") === "yes") {
        this.setState({ isHidePro: true });
      }

      //Check for data update
      //upgrade data from old version
      let res1 = await upgradeStorage(this.handleFinishUpgrade);
      let res2 = upgradeConfig();
      if (!res1 || !res2) {
        console.error("upgrade failed");
      }

      //Detect data modification
      let lastSyncTime = getLastSyncTimeFromConfigJson();
      if (
        ConfigService.getItem("lastSyncTime") &&
        lastSyncTime > parseInt(ConfigService.getItem("lastSyncTime") || "0")
      ) {
        this.setState({ isDataChange: true });
      }

      ipcRenderer.on("reading-finished", async (event: any, config: any) => {
        this.handleFinishReading();
      });
    } else {
      upgradeConfig();
      const status = await LocalFileManager.getPermissionStatus();
      if (
        !ConfigService.getReaderConfig("isUseLocal") &&
        LocalFileManager.isSupported()
      ) {
        this.props.handleLocalFileDialog(true);
      } else if (
        ConfigService.getReaderConfig("isUseLocal") === "yes" &&
        !status.directoryName
      ) {
        this.props.handleLocalFileDialog(true);
      } else if (
        ConfigService.getReaderConfig("isUseLocal") === "yes" &&
        (status.needsReauthorization || !status.hasAccess)
      ) {
        this.props.handleLocalFileDialog(true);
      }
    }
    window.addEventListener("resize", () => {
      this.setState({ width: document.body.clientWidth });
    });
    this.props.handleCloudSyncFunc(this.handleCloudSync);
    document.addEventListener("visibilitychange", async (event) => {
      if (
        document.visibilityState === "visible" &&
        !isElectron &&
        ConfigService.getReaderConfig("isFinishWebReading") === "yes"
      ) {
        await this.handleFinishReading();
        // ConfigService.setReaderConfig("isFinishWebReading", "no");
      }
    });
  }
  async UNSAFE_componentWillReceiveProps(
    nextProps: Readonly<HeaderProps>,
    _nextContext: any
  ) {
    if (nextProps.isAuthed && nextProps.isAuthed !== this.props.isAuthed) {
      if (isElectron) {
      } else {
        addChatBox();
      }
      if (ConfigService.getReaderConfig("isProUpgraded") !== "yes") {
        try {
          ConfigService.setReaderConfig("isProUpgraded", "yes");
          await generateSyncRecord();
        } catch (error) {
          console.error(error);
        }
      }
      await this.props.handleFetchUserInfo();
      if (
        ConfigService.getReaderConfig("isDisableAutoSync") !== "yes" &&
        ConfigService.getItem("defaultSyncOption")
      ) {
        this.setState({ isSync: true });
        await this.handleCloudSync();
      }
    }
    if (!nextProps.isAuthed && nextProps.isAuthed !== this.props.isAuthed) {
      if (isElectron) {
      } else {
        removeChatBox();
      }
    }
  }
  handleFinishReading = async () => {
    if (
      ConfigService.getReaderConfig("isDisableAutoSync") !== "yes" &&
      ConfigService.getItem("defaultSyncOption") &&
      !this.state.isSync
    ) {
      ConfigService.setItem("isFinshReading", "yes");
      await this.props.handleFetchUserInfo();
      this.setState({ isSync: true }, async () => {
        await this.handleCloudSync();
        ConfigService.setItem("isFinshReading", "no");
      });
    }
  };
  handleFinishUpgrade = () => {
    setTimeout(() => {
      if (this.props.mode === "home") {
        this.props.history.push("/manager/home");
      }
    }, 2000);
  };

  syncFromLocation = async () => {
    let result = await restoreFromConfigJson();
    if (result) {
      this.setState({ isDataChange: false });
      //Check for data update
      let lastSyncTime = getLastSyncTimeFromConfigJson();
      if (ConfigService.getItem("lastSyncTime") && lastSyncTime) {
        ConfigService.setItem("lastSyncTime", lastSyncTime + "");
      } else {
        let timestamp = new Date().getTime().toString();
        ConfigService.setItem("lastSyncTime", timestamp);
      }
    }
    if (!result) {
      toast.error(this.props.t("Sync failed"));
    } else {
      toast.success(
        this.props.t("Synchronisation successful") +
          " (" +
          this.props.t("Local") +
          ")"
      );
      toast.success(
        this.props.t(
          "Your data has been imported from your local folder, Upgrade to pro to get more advanced features"
        ),
        {
          duration: 4000,
        }
      );
    }
  };
  handleLocalSync = async () => {
    let lastSyncTime = getLastSyncTimeFromConfigJson();
    if (!lastSyncTime) {
      await this.syncToLocation();
    } else {
      if (
        ConfigService.getItem("lastSyncTime") &&
        lastSyncTime <= parseInt(ConfigService.getItem("lastSyncTime")!)
      ) {
        await this.syncToLocation();
      } else {
        await this.syncFromLocation();
      }
    }

    this.setState({ isSync: false });
  };
  beforeSync = async () => {
    if (!ConfigService.getItem("defaultSyncOption")) {
      toast.error(this.props.t("Please add data source in the setting"));
      return false;
    }
    if (
      ConfigService.getReaderConfig("isEnableKoodoSync") === "yes" &&
      this.props.userInfo &&
      this.props.userInfo.default_sync_option &&
      this.props.userInfo.default_sync_option !== this.props.defaultSyncOption
    ) {
      toast.error(
        this.props.t(
          "The default sync options in the local and cloud are inconsistent, please set the local default sync option to "
        ) +
          this.props.t(
            driveList.find(
              (item) => item.value === this.props.userInfo.default_sync_option
            )?.label || ""
          ),
        {
          duration: 4000,
        }
      );
      return false;
    }
    let config = await getCloudConfig(
      ConfigService.getItem("defaultSyncOption") || ""
    );
    if (Object.keys(config).length === 0) {
      toast.error(this.props.t("Cannot get sync config"));
      return false;
    }
    if (
      ConfigService.getItem("defaultSyncOption") === "google" &&
      !config.version
    ) {
      let targetDrive = "google";
      await TokenService.setToken(targetDrive + "_token", "");
      SyncService.removeSyncUtil(targetDrive);
      removeCloudConfig(targetDrive);
      if (isElectron) {
        const { ipcRenderer } = window.require("electron");
        await ipcRenderer.invoke("cloud-close", {
          service: targetDrive,
        });
      }
      ConfigService.deleteListConfig(targetDrive, "dataSourceList");
      this.props.handleFetchDataSourceList();
      if (targetDrive === ConfigService.getItem("defaultSyncOption")) {
        ConfigService.removeItem("defaultSyncOption");
        this.props.handleFetchDefaultSyncOption();
      }
      if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
        resetKoodoSync();
      }
      toast(
        this.props.t(
          "In order to let you directly manage your data in Google Drive, we have deprecated the old Google Drive token. Please reauthorize Google Drive in the settings. Your new data will be stored in the root directory of your Google Drive, and you can manage it directly in the Google Drive web interface."
        ),
        { duration: 4000 }
      );
      return false;
    }
    await checkMissingBook();
    let checkResult = await checkBrokenData();
    if (checkResult) {
      toast.error(
        this.props.t(
          "Broken data detected, please click the setting button to reset the sync records"
        )
      );
      return false;
    }
    if (ConfigService.getReaderConfig("isEnableKoodoSync") !== "yes") {
      toast.loading(
        this.props.t("Start syncing") +
          " (" +
          this.props.t(
            driveList.find(
              (item) =>
                item.value === ConfigService.getItem("defaultSyncOption")
            )?.label || ""
          ) +
          ")",
        { id: "syncing", position: "bottom-center" }
      );
    }

    return true;
  };
  getCompareResult = async () => {
    let localSyncRecords = ConfigService.getAllSyncRecord();
    let cloudSyncRecords = await ConfigUtil.getCloudConfig("sync");
    return await SyncHelper.compareAll(
      localSyncRecords,
      cloudSyncRecords,
      ConfigService,
      TokenService,
      ConfigUtil
    );
  };
  handleSyncStateChange = (isSyncing: boolean) => {
    this.setState({ isSync: isSyncing });
  };
  handleCloudSync = async (): Promise<false | undefined> => {
    if (this.isSyncing) {
      console.info("Sync already in progress, skipping...");
      return false;
    }
    this.isSyncing = true;

    try {
      this.timer = await showTaskProgress(this.handleSyncStateChange);
      if (!this.timer) {
        this.setState({ isSync: false });
        return false;
      }

      let res = await this.beforeSync();
      if (!res) {
        clearInterval(this.timer);
        this.setState({ isSync: false });
        return;
      }
      let compareResult = await this.getCompareResult();
      await this.handleSync(compareResult);
      clearInterval(this.timer);
      this.setState({ isSync: false });
    } catch (error) {
      console.error(error);
      toast.error(
        this.props.t("Sync failed") +
          ": " +
          (error instanceof Error ? error.message : String(error))
      );
      clearInterval(this.timer);
      this.setState({ isSync: false });
      return false;
    } finally {
      this.isSyncing = false;
    }
    setTimeout(() => {
      toast.dismiss("syncing");
    }, 3000);
    return;
  };
  handleSuccess = async () => {
    if (ConfigService.getItem("isFinshReading") !== "yes" || !isElectron) {
      this.props.handleFetchBooks();
    }

    this.props.handleFetchBookmarks();
    this.props.handleFetchNotes();
    toast.success(this.props.t("Synchronisation successful"), {
      id: "syncing",
    });

    if (
      ConfigService.getItem("defaultSyncOption") === "adrive" &&
      ConfigService.getReaderConfig("hasShowAliyunWarning") !== "yes"
    ) {
      ConfigService.setReaderConfig("hasShowAliyunWarning", "yes");
      toast.success(
        this.props.t(
          "We have bypassed the synchronization of book cover for Aliyun Drive, covers will be downloaded automatically when you open the book next time."
        ),
        {
          duration: 4000,
        }
      );
    }
    if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
      ConfigUtil.updateSyncData();
    }
    //when book is empty, need to refresh the book list
    setTimeout(async () => {
      if (this.props.mode === "home") {
        this.props.history.push("/manager/home");
        if (
          ConfigService.getReaderConfig("isFirstSync") !== "no" &&
          ConfigService.getReaderConfig("isEnableKoodoSync") !== "yes" &&
          this.props.defaultSyncOption !== "webdav" &&
          this.props.defaultSyncOption !== "ftp" &&
          this.props.defaultSyncOption !== "sftp" &&
          this.props.defaultSyncOption !== "smb" &&
          this.props.defaultSyncOption !== "s3compatible" &&
          this.props.defaultSyncOption !== "icloud" &&
          this.props.defaultSyncOption !== "docker"
        ) {
          ConfigService.setReaderConfig("isFirstSync", "no");
          let result = await vexComfirmAsync(
            `<h3>${this.props.t("Enable Koodo Sync")}</h3><p>${
              this.props.t(
                "To enjoy a faster and seamless synchronization experience."
              ) +
              " " +
              this.props.t(
                "Your reading progress, notes, highlights, bookmarks, and other data will be stored and synced through our cloud service. Your books and covers will still be synced by your added data sources. To save you from repeatedly entering your data source credentials on new devices, your credentials will be encrypted and stored securely in our cloud too. You can disable this feature anytime in the settings."
              )
            }</p>`
          );
          if (result) {
            ConfigService.setReaderConfig("isEnableKoodoSync", "yes");
            let encryptedToken = await TokenService.getToken(
              this.props.defaultSyncOption + "_token"
            );
            await updateUserConfig({
              is_enable_koodo_sync: "yes",
              default_sync_option: this.props.defaultSyncOption,
              default_sync_token: encryptedToken || "",
            });
            await this.props.handleFetchUserInfo();
            toast.success(this.props.t("Setup successful"));
            this.handleCloudSync();
          }
        }
      }
    }, 1000);
  };
  handleSync = async (compareResult) => {
    try {
      let tasks = await SyncHelper.startSync(
        compareResult,
        ConfigService,
        DatabaseService,
        ConfigUtil,
        BookUtil,
        CoverUtil
      );
      await SyncHelper.runTasksWithLimit(
        tasks,
        99,
        ConfigService.getItem("defaultSyncOption")
      );

      clearInterval(this.timer);
      this.setState({ isSync: false });
      let stats = await getTaskStats();
      if (stats.hasFailedTasks) {
        toast.error(
          this.props.t(
            "Tasks failed after multiple retries, please check the network connection or reauthorize the data source in the settings"
          ),
          {
            id: "syncing",
            duration: 6000,
          }
        );
        return;
      }
      toast.loading(this.props.t("Almost finished"), {
        id: "syncing",
        position: "bottom-center",
      });
      await this.handleSuccess();
    } catch (error) {
      console.error(error);
      clearInterval(this.timer);
      this.setState({ isSync: false });
      toast.error(
        this.props.t("Sync failed") +
          ": " +
          (error instanceof Error ? error.message : String(error))
      );

      return;
    }
  };
  syncToLocation = async () => {
    let timestamp = new Date().getTime().toString();
    ConfigService.setItem("lastSyncTime", timestamp);
    await backupToConfigJson();
    toast.success(
      this.props.t("Synchronisation successful") +
        " (" +
        this.props.t("Local") +
        ")"
    );
    toast.success(
      this.props.t(
        "Your data has been exported to your local folder, learn how to sync your data to your other devices by visiting our documentation, Upgrade to pro to get more advanced features"
      ),
      {
        duration: 4000,
      }
    );
  };

  render() {
    return (
      <div
        className="header"
        style={this.props.isCollapsed ? { marginLeft: "40px" } : {}}
      >
        {isElectron && this.props.isAuthed && (
          <div
            className="header-chat-widget"
            onClick={() => {
              window.require("electron").ipcRenderer.invoke("new-chat", {
                url:
                  getWebsiteUrl() +
                  (ConfigService.getReaderConfig("lang").startsWith("zh")
                    ? "/zh/faq"
                    : "/en/faq") +
                  "?referer=app&version=" +
                  packageJson.version +
                  "&client=desktop",
                locale: getChatLocale(),
              });
            }}
          >
            <img
              src={require("../../assets/images/chat-widget.png")}
              alt="logo"
              className="login-mobile-qr"
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        )}
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
              data-tooltip-place="left"
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
              data-tooltip-place="left"
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
              data-tooltip-place="left"
            >
              <span className="icon-archive header-archive-icon"></span>
            </span>
          </div>

          <div
            className="setting-icon-container"
            onClick={async () => {
              if (!isElectron && !this.props.isAuthed) {
                toast(
                  this.props.t(
                    "This feature is not available in the free version"
                  )
                );
                return;
              }
              this.setState({ isSync: true });
              if (this.props.isAuthed) {
                await this.props.handleFetchUserInfo();
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
              data-tooltip-place="left"
            >
              <span
                className={
                  "icon-sync setting-icon" +
                  (this.state.isSync ? " icon-rotate" : "")
                }
                style={
                  this.state.isDataChange ? { color: "rgb(35, 170, 242)" } : {}
                }
              ></span>
            </span>
          </div>
        </div>

        {!this.props.isAuthed && !this.state.isHidePro ? (
          <div className="header-report-container">
            <span
              style={{ textDecoration: "underline" }}
              onClick={() => {
                if (
                  window.location.hostname !== "web.koodoreader.com" &&
                  !isElectron
                ) {
                  this.props.handleSetting(true);
                  this.props.handleSettingMode("account");
                  return;
                }
                this.props.history.push("/login");
              }}
            >
              <Trans>Pro version</Trans>
              <span> </span>
            </span>

            <span
              className="icon-close icon-pro-close"
              onClick={() => {
                ConfigService.setReaderConfig("isHidePro", "yes");
                this.setState({ isHidePro: true });
              }}
            ></span>
          </div>
        ) : null}
        {this.props.isAuthed &&
        this.props.userInfo &&
        ((this.props.userInfo.type === "pro" &&
          this.props.userInfo.valid_until <
            new Date().getTime() / 1000 + 30 * 24 * 3600) ||
          (this.props.userInfo.type === "trial" &&
            this.props.userInfo.valid_until <
              new Date().getTime() / 1000 + 3 * 24 * 3600)) ? (
          <div className="header-report-container">
            <span
              style={{ textDecoration: "underline" }}
              onClick={async () => {
                let response = await getTempToken();
                if (response.code === 200) {
                  let tempToken = response.data.access_token;
                  let deviceUuid = await TokenService.getFingerprint();
                  openInBrowser(
                    getWebsiteUrl() +
                      (ConfigService.getReaderConfig("lang").startsWith("zh")
                        ? "/zh"
                        : "/en") +
                      "/pricing?temp_token=" +
                      tempToken +
                      "&device_uuid=" +
                      deviceUuid
                  );
                } else if (response.code === 401) {
                  this.props.handleFetchAuthed();
                }
              }}
            >
              <Trans>Renew Pro</Trans>
            </span>
          </div>
        ) : null}
        {KookitConfig.CloudMode !== "production" ? (
          <div className="header-report-container" style={{ right: "300px" }}>
            <span
              style={{
                color: "red",
                opacity: 1,
                fontWeight: "bold",
              }}
            >
              <Trans>TEST</Trans>
              <span> </span>
            </span>
          </div>
        ) : null}

        <ImportLocal
          {...{
            handleDrag: this.props.handleDrag,
          }}
        />
        <SupportDialog />
        <UpdateInfo />
      </div>
    );
  }
}

export default Header;
