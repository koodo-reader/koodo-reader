import React from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import i18n from "../../../i18n";
import { removeCloudConfig } from "../../../utils/file/common";
import { isElectron } from "react-device-detect";
import _ from "underscore";
import { syncSettingList } from "../../../constants/settingList";
import { themeList } from "../../../constants/themeList";
import toast from "react-hot-toast";
import {
  handleContextMenu,
  openExternalUrl,
  testConnection,
  WEBSITE_URL,
} from "../../../utils/common";
import { getStorageLocation } from "../../../utils/common";
import { driveInputConfig, driveList } from "../../../constants/driveList";
import {
  ConfigService,
  SyncUtil,
  TokenService,
} from "../../../assets/lib/kookit-extra-browser.min";
import {
  encryptToken,
  onSyncCallback,
} from "../../../utils/request/thirdparty";
import SyncService from "../../../utils/storage/syncService";
import { updateUserConfig } from "../../../utils/request/user";
declare var window: any;
class SyncSetting extends React.Component<SettingInfoProps, SettingInfoState> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      isTouch: ConfigService.getReaderConfig("isTouch") === "yes",
      isMergeWord: ConfigService.getReaderConfig("isMergeWord") === "yes",
      isPreventTrigger:
        ConfigService.getReaderConfig("isPreventTrigger") === "yes",
      isAutoFullscreen:
        ConfigService.getReaderConfig("isAutoFullscreen") === "yes",
      isPreventAdd: ConfigService.getReaderConfig("isPreventAdd") === "yes",
      isLemmatizeWord:
        ConfigService.getReaderConfig("isLemmatizeWord") === "yes",
      isOpenBook: ConfigService.getReaderConfig("isOpenBook") === "yes",
      isExpandContent:
        ConfigService.getReaderConfig("isExpandContent") === "yes",
      isDisablePopup: ConfigService.getReaderConfig("isDisablePopup") === "yes",
      isDisableTrashBin:
        ConfigService.getReaderConfig("isDisableTrashBin") === "yes",
      isDeleteShelfBook:
        ConfigService.getReaderConfig("isDeleteShelfBook") === "yes",
      isHideShelfBook:
        ConfigService.getReaderConfig("isHideShelfBook") === "yes",
      isPreventSleep: ConfigService.getReaderConfig("isPreventSleep") === "yes",
      isOpenInMain: ConfigService.getReaderConfig("isOpenInMain") === "yes",
      isDisableUpdate:
        ConfigService.getReaderConfig("isDisableUpdate") === "yes",
      isPrecacheBook: ConfigService.getReaderConfig("isPrecacheBook") === "yes",
      appSkin: ConfigService.getReaderConfig("appSkin"),
      isUseBuiltIn: ConfigService.getReaderConfig("isUseBuiltIn") === "yes",
      isKeepLocal: ConfigService.getReaderConfig("isKeepLocal") === "yes",
      isDisableAutoSync:
        ConfigService.getReaderConfig("isDisableAutoSync") === "yes",
      isEnableKoodoSync:
        ConfigService.getReaderConfig("isEnableKoodoSync") === "yes",
      isDisablePDFCover:
        ConfigService.getReaderConfig("isDisablePDFCover") === "yes",
      currentThemeIndex: _.findLastIndex(themeList, {
        name: ConfigService.getReaderConfig("themeColor"),
      }),
      storageLocation: getStorageLocation() || "",
      isAddNew: false,
      settingLogin: "",
      driveConfig: {},
      loginConfig: {},
    };
  }
  handleRest = (_bool: boolean) => {
    toast.success(this.props.t("Change successful"));
  };
  handleJump = (url: string) => {
    openExternalUrl(url);
  };
  handleSetting = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any);
    ConfigService.setReaderConfig(
      stateName,
      this.state[stateName] ? "no" : "yes"
    );
    this.handleRest(this.state[stateName]);
  };
  handleAddDataSource = (event: any) => {
    let targetDrive = event.target.value;
    if (!targetDrive) {
      return;
    }
    if (
      !driveList
        .find((item) => item.value === targetDrive)
        ?.support.includes("browser") &&
      !isElectron
    ) {
      toast(
        this.props.t(
          "Koodo Reader's web version are limited by the browser, for more powerful features, please download the desktop version."
        )
      );
      return;
    }
    if (
      driveList.find((item) => item.value === targetDrive)?.isPro &&
      !this.props.isAuthed
    ) {
      toast(this.props.t("This feature is not available in the free version"));
      return;
    }
    this.props.handleSettingDrive(targetDrive);
    let settingDrive = targetDrive;
    if (
      settingDrive === "dropbox" ||
      settingDrive === "google" ||
      settingDrive === "boxnet" ||
      settingDrive === "pcloud" ||
      settingDrive === "adrive" ||
      settingDrive === "microsoft"
    ) {
      this.handleJump(new SyncUtil(settingDrive, {}).getAuthUrl());
    }
  };
  handleDeleteDataSource = async (event: any) => {
    let targetDrive = event.target.value;
    if (!targetDrive) {
      return;
    }
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
    toast.success(this.props.t("Deletion successful"));
  };
  handleSetDefaultSyncOption = (event: any) => {
    if (!event.target.value) {
      return;
    }
    ConfigService.setItem("defaultSyncOption", event.target.value);
    this.props.handleFetchDefaultSyncOption();
    toast.success(this.props.t("Change successful"));
  };
  handleCancelDrive = () => {
    this.props.handleSettingDrive("");
  };
  handleConfirmDrive = async () => {
    let flag = true;
    for (let item of driveInputConfig[this.props.settingDrive]) {
      if (!this.state.driveConfig[item.value] && item.required) {
        toast.error(
          this.props.t("Missing parameters") + ": " + this.props.t(item.label)
        );
        flag = false;
        break;
      }
    }
    if (!flag) {
      return;
    }
    if (
      this.props.settingDrive === "webdav" ||
      this.props.settingDrive === "ftp" ||
      this.props.settingDrive === "sftp" ||
      this.props.settingDrive === "mega" ||
      this.props.settingDrive === "s3compatible"
    ) {
      toast.loading(i18n.t("Adding"), { id: "adding-sync-id" });
      let res = await encryptToken(
        this.props.settingDrive,
        this.state.driveConfig
      );
      if (res.code === 200) {
        ConfigService.setListConfig(this.props.settingDrive, "dataSourceList");
        toast.success(i18n.t("Binding successful"), { id: "adding-sync-id" });
      } else {
        toast.error(i18n.t("Binding failed"), { id: "adding-sync-id" });
      }
    } else {
      await onSyncCallback(
        this.props.settingDrive,
        this.state.driveConfig.token
      );
    }
    if (this.props.isAuthed) {
      ConfigService.setItem("defaultSyncOption", this.props.settingDrive);
      this.props.handleFetchDefaultSyncOption();
    }
    this.props.handleFetchDataSourceList();
    this.props.handleSettingDrive("");
  };
  renderSwitchOption = (optionList: any[]) => {
    return optionList.map((item) => {
      return (
        <div
          style={item.isElectron ? (isElectron ? {} : { display: "none" }) : {}}
          key={item.propName}
        >
          <div className="setting-dialog-new-title" key={item.title}>
            <span style={{ width: "calc(100% - 100px)" }}>
              <Trans>{item.title}</Trans>
            </span>

            <span
              className="single-control-switch"
              onClick={() => {
                switch (item.propName) {
                  case "isEnableKoodoSync":
                    updateUserConfig({
                      is_enable_koodo_sync: !this.state.isEnableKoodoSync
                        ? "yes"
                        : "no",
                    });
                    this.handleSetting(item.propName);
                    break;
                  default:
                    this.handleSetting(item.propName);
                    break;
                }
              }}
              style={this.state[item.propName] ? {} : { opacity: 0.6 }}
            >
              <span
                className="single-control-button"
                style={
                  this.state[item.propName]
                    ? {
                        transform: "translateX(20px)",
                        transition: "transform 0.5s ease",
                      }
                    : {
                        transform: "translateX(0px)",
                        transition: "transform 0.5s ease",
                      }
                }
              ></span>
            </span>
          </div>
          <p className="setting-option-subtitle">
            <Trans>{item.desc}</Trans>
          </p>
        </div>
      );
    });
  };
  render() {
    return (
      <>
        {this.props.settingDrive && (
          <div
            className="voice-add-new-container"
            style={{
              marginLeft: "25px",
              width: "calc(100% - 50px)",
              fontWeight: 500,
            }}
          >
            {this.props.settingDrive === "webdav" ||
            this.props.settingDrive === "ftp" ||
            this.props.settingDrive === "sftp" ||
            this.props.settingDrive === "mega" ||
            this.props.settingDrive === "s3compatible" ? (
              <>
                {driveInputConfig[this.props.settingDrive].map((item) => {
                  return (
                    <>
                      <input
                        type={item.type}
                        name={item.value}
                        key={item.value}
                        placeholder={
                          this.props.t(item.label) +
                          (item.required
                            ? ""
                            : " (" + this.props.t("Optional") + ")")
                        }
                        onChange={(e) => {
                          if (e.target.value) {
                            this.setState((prevState) => ({
                              driveConfig: {
                                ...prevState.driveConfig,
                                [item.value]: e.target.value.trim(),
                              },
                            }));
                          }
                        }}
                        onContextMenu={() => {
                          handleContextMenu(
                            "token-dialog-" + item.value + "-box",
                            true
                          );
                        }}
                        id={"token-dialog-" + item.value + "-box"}
                        className="token-dialog-username-box"
                      />
                      {item.example && (
                        <div style={{ marginTop: "5px", fontSize: "12px" }}>
                          {this.props.t("Example")}: {item.example}
                        </div>
                      )}
                    </>
                  );
                })}
              </>
            ) : (
              <>
                <textarea
                  className="token-dialog-token-box"
                  id="token-dialog-token-box"
                  placeholder={this.props.t(
                    "Please click the authorize button below to authorize your account, enter the obtained credentials here, and then click the bind button below"
                  )}
                  onChange={(e) => {
                    if (e.target.value) {
                      this.setState((prevState) => ({
                        driveConfig: {
                          ...prevState.driveConfig,
                          token: e.target.value.trim(),
                        },
                      }));
                    }
                  }}
                  onContextMenu={() => {
                    handleContextMenu("token-dialog-token-box");
                  }}
                />
              </>
            )}
            {this.props.settingDrive === "webdav" && !isElectron && (
              <div
                className="token-dialog-tip"
                style={{
                  marginTop: "10px",
                  fontSize: "13px",
                  lineHeight: "16px",
                  color: "rgba(231, 69, 69, 0.8)",
                }}
              >
                {this.props.t(
                  "Only WebDAV service provided by Alist is directly supported in Browser, Other WebDAV services need to enable CORS to work properly"
                )}
              </div>
            )}
            {this.props.settingDrive === "s3compatible" && !isElectron && (
              <div
                className="token-dialog-tip"
                style={{
                  marginTop: "10px",
                  fontSize: "13px",
                  lineHeight: "16px",
                  color: "rgba(231, 69, 69, 0.8)",
                }}
              >
                {this.props.t(
                  "Some S3 services are not compatible with browser environments. If you encounter connection issues, please refer to the service provider's official documentation for instructions on enabling CORS."
                )}
              </div>
            )}
            <div className="token-dialog-button-container">
              <div
                className="voice-add-confirm"
                onClick={async () => {
                  if (
                    this.props.settingDrive === "webdav" ||
                    this.props.settingDrive === "s3compatible"
                  ) {
                    let result = await testConnection(
                      this.props.settingDrive,
                      this.state.driveConfig
                    );
                    if (!result) {
                      return;
                    }
                  }
                  this.handleConfirmDrive();
                }}
              >
                <Trans>Bind</Trans>
              </div>

              <div className="voice-add-button-container">
                <div
                  className="voice-add-cancel"
                  onClick={() => {
                    this.handleCancelDrive();
                  }}
                >
                  <Trans>Cancel</Trans>
                </div>
                {(this.props.settingDrive === "dropbox" ||
                  this.props.settingDrive === "google" ||
                  this.props.settingDrive === "boxnet" ||
                  this.props.settingDrive === "pcloud" ||
                  this.props.settingDrive === "adrive" ||
                  this.props.settingDrive === "microsoft") && (
                  <div
                    className="voice-add-confirm"
                    style={{ marginRight: "10px" }}
                    onClick={async () => {
                      this.handleJump(
                        new SyncUtil(this.props.settingDrive, {}).getAuthUrl()
                      );
                    }}
                  >
                    <Trans>Authorize</Trans>
                  </div>
                )}
                {(this.props.settingDrive === "webdav" ||
                  this.props.settingDrive === "ftp" ||
                  this.props.settingDrive === "sftp" ||
                  this.props.settingDrive === "mega" ||
                  this.props.settingDrive === "s3compatible") && (
                  <div
                    className="voice-add-confirm"
                    style={{ marginRight: "10px" }}
                    onClick={async () => {
                      testConnection(
                        this.props.settingDrive,
                        this.state.driveConfig
                      );
                    }}
                  >
                    <Trans>Test</Trans>
                  </div>
                )}
                {(this.props.settingDrive === "webdav" ||
                  this.props.settingDrive === "ftp" ||
                  this.props.settingDrive === "s3compatible" ||
                  this.props.settingDrive === "sftp") &&
                  ConfigService.getReaderConfig("lang") &&
                  ConfigService.getReaderConfig("lang").startsWith("zh") && (
                    <div
                      className="voice-add-cancel"
                      style={{ borderWidth: 0, lineHeight: "30px" }}
                      onClick={() => {
                        openExternalUrl(WEBSITE_URL + "/zh/add-source");
                      }}
                    >
                      {this.props.t("How to fill out")}
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
        <div className="setting-dialog-new-title">
          <Trans>Add data source</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            onChange={this.handleAddDataSource}
          >
            {[
              {
                label: "Please select",
                value: "",
                isPro: false,
                support: ["desktop", "browser", "phone"],
              },
              ...driveList,
            ]
              .filter((item) => !this.props.dataSourceList.includes(item.value))
              .filter((item) => {
                if (!isElectron) {
                  return item.support.includes("browser");
                } else {
                  return true;
                }
              })
              .map((item) => (
                <option
                  value={item.value}
                  key={item.value}
                  className="lang-setting-option"
                >
                  {this.props.t(item.label) + (item.isPro ? " (Pro)" : "")}
                </option>
              ))}
          </select>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Delete data source</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            onChange={this.handleDeleteDataSource}
          >
            {[{ label: "Please select", value: "", isPro: false }, ...driveList]
              .filter(
                (item) =>
                  this.props.dataSourceList.includes(item.value) ||
                  item.value === ""
              )
              .map((item) => (
                <option
                  value={item.value}
                  key={item.value}
                  className="lang-setting-option"
                >
                  {this.props.t(item.label) + (item.isPro ? " (Pro)" : "")}
                </option>
              ))}
          </select>
        </div>
        {this.props.isAuthed && (
          <div className="setting-dialog-new-title">
            <Trans>Set default sync option</Trans>
            <select
              name=""
              className="lang-setting-dropdown"
              onChange={this.handleSetDefaultSyncOption}
            >
              {[
                { label: "Please select", value: "", isPro: false },
                ...driveList,
              ]
                .filter(
                  (item) =>
                    this.props.dataSourceList.includes(item.value) ||
                    item.value === "" ||
                    item.value === "local"
                )
                .map((item) => (
                  <option
                    value={item.value}
                    key={item.value}
                    className="lang-setting-option"
                    selected={
                      item.value === this.props.defaultSyncOption ? true : false
                    }
                  >
                    {this.props.t(item.label) + (item.isPro ? " (Pro)" : "")}
                  </option>
                ))}
            </select>
          </div>
        )}
        {this.props.isAuthed && this.renderSwitchOption(syncSettingList)}
      </>
    );
  }
}

export default SyncSetting;
