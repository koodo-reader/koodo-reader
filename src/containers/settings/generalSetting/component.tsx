import React from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import i18n from "../../../i18n";
import { changeLibrary, changePath } from "../../../utils/file/common";
import { isElectron } from "react-device-detect";
import _ from "underscore";
import {
  generalSettingList,
  langList,
  searchList,
} from "../../../constants/settingList";
import { themeList } from "../../../constants/themeList";
import toast from "react-hot-toast";
import {
  clearAllData,
  generateSyncRecord,
  getStorageLocation,
  reloadManager,
  vexPromptAsync,
} from "../../../utils/common";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { LocalFileManager } from "../../../utils/file/localFile";

declare var window: any;
class GeneralSetting extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      isTouch: ConfigService.getReaderConfig("isTouch") === "yes",
      isImportPath: ConfigService.getReaderConfig("isImportPath") === "yes",
      isMergeWord: ConfigService.getReaderConfig("isMergeWord") === "yes",
      isPreventTrigger:
        ConfigService.getReaderConfig("isPreventTrigger") === "yes",
      isAutoFullscreen:
        ConfigService.getReaderConfig("isAutoFullscreen") === "yes",
      isPreventAdd: ConfigService.getReaderConfig("isPreventAdd") === "yes",
      isOpenBook: ConfigService.getReaderConfig("isOpenBook") === "yes",
      isDisablePopup: ConfigService.getReaderConfig("isDisablePopup") === "yes",
      isDisableTrashBin:
        ConfigService.getReaderConfig("isDisableTrashBin") === "yes",
      isDeleteShelfBook:
        ConfigService.getReaderConfig("isDeleteShelfBook") === "yes",
      isHideShelfBook:
        ConfigService.getReaderConfig("isHideShelfBook") === "yes",
      isPreventSleep: ConfigService.getReaderConfig("isPreventSleep") === "yes",
      isAlwaysOnTop: ConfigService.getReaderConfig("isAlwaysOnTop") === "yes",
      isAutoMaximizeWin:
        ConfigService.getReaderConfig("isAutoMaximizeWin") === "yes",
      isAutoLaunch: ConfigService.getReaderConfig("isAutoLaunch") === "yes",
      isOpenInMain: ConfigService.getReaderConfig("isOpenInMain") === "yes",
      isExportOriginalName:
        ConfigService.getReaderConfig("isExportOriginalName") === "yes",
      isDisableUpdate:
        ConfigService.getReaderConfig("isDisableUpdate") === "yes",
      isPrecacheBook: ConfigService.getReaderConfig("isPrecacheBook") === "yes",
      appSkin: ConfigService.getReaderConfig("appSkin"),
      isUseBuiltIn: ConfigService.getReaderConfig("isUseBuiltIn") === "yes",
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
      status: {
        hasAccess: false,
        needsReauthorization: false,
        directoryName: "",
      },
    };
  }
  async componentDidMount() {
    if (!isElectron) {
      const status = await LocalFileManager.getPermissionStatus();
      this.setState({
        storageLocation: status.directoryName || "",
      });
    }
  }
  handleRest = (_bool: boolean) => {
    toast.success(this.props.t("Change successful"));
  };
  changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    ConfigService.setReaderConfig("lang", lng);
  };
  changeSearch = (searchEngine: string) => {
    ConfigService.setReaderConfig("searchEngine", searchEngine);
  };
  handleSetting = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any);
    ConfigService.setReaderConfig(
      stateName,
      this.state[stateName] ? "no" : "yes"
    );
    this.handleRest(this.state[stateName]);
  };
  handleChangeLocation = async () => {
    const { ipcRenderer } = window.require("electron");
    const newPath = await ipcRenderer.invoke("select-path");
    if (!newPath) {
      return;
    }
    let isSuccess = await changePath(newPath);
    if (!isSuccess) {
      toast.error(this.props.t("Change failed"));
      return;
    }
    ConfigService.setItem("storageLocation", newPath);
    this.setState({ storageLocation: newPath });
    toast.success(this.props.t("Change successful"));
    this.props.handleFetchBooks();
  };
  handleSwitchLibrary = async () => {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      const newPath = await ipcRenderer.invoke("select-path");
      if (!newPath) {
        return;
      }
      let isSuccess = await changeLibrary(newPath);
      if (!isSuccess) {
        toast.error(this.props.t("Switch failed"));
        return;
      }
      ConfigService.setItem("storageLocation", newPath);
      this.setState({ storageLocation: newPath });
      toast.success(this.props.t("Switch successful"));
      this.props.handleFetchBooks();
      await generateSyncRecord();
      setTimeout(() => {
        this.props.history.push("/manager/home");
      }, 2000);
    } else {
      try {
        const directoryHandle = await LocalFileManager.requestDirectoryAccess();

        if (directoryHandle) {
          // 成功获取权限
          ConfigService.setReaderConfig("isUseLocal", "yes");
          ConfigService.setReaderConfig(
            "localDirectoryName",
            directoryHandle.name
          );
          this.setState({
            storageLocation: directoryHandle.name,
          });
          toast.success(
            this.props.t("Local folder access granted successfully")
          );
          this.props.handleFetchBooks();
          setTimeout(() => {
            this.props.history.push("/manager/home");
          }, 2000);
        } else {
          toast.success(this.props.t("Failed to get folder access permission"));
        }
      } catch (error) {
        console.error("Error selecting folder:", error);
        toast.success(this.props.t("Error occurred while selecting folder"));
      }
    }
  };
  handleMergeWord = () => {
    if (this.state.isOpenInMain && !this.state.isMergeWord) {
      toast(this.props.t("Please turn off open books in the main window"));
      return;
    }
    if (this.state.isAutoFullscreen && !this.state.isMergeWord) {
      toast(this.props.t("Please turn off auto open book in full screen"));
      return;
    }
    this.handleSetting("isMergeWord");
    if (ConfigService.getReaderConfig("isMergeWord") === "yes") {
      ConfigService.setReaderConfig("isHideBackground", "yes");
    }
  };
  handleOpenInMain = () => {
    if (this.state.isMergeWord && !this.state.isOpenInMain) {
      toast(this.props.t("Please turn off merge with word first"));
      return;
    }
    this.handleSetting("isOpenInMain");
  };
  handleAlwaysOnTop = () => {
    const { ipcRenderer } = window.require("electron");
    ipcRenderer.invoke("set-always-on-top", {
      isAlwaysOnTop: this.state.isAlwaysOnTop ? "no" : "yes",
    });
    this.handleSetting("isAlwaysOnTop");
  };
  handleMaximizeWin = () => {
    const { ipcRenderer } = window.require("electron");
    ipcRenderer.invoke("set-auto-maximize", {
      isAutoMaximizeWin: this.state.isAutoMaximizeWin ? "no" : "yes",
    });
    this.handleSetting("isAutoMaximizeWin");
  };
  handleAutoLaunch = () => {
    const { ipcRenderer } = window.require("electron");
    ipcRenderer.invoke("toggle-auto-launch", {
      isAutoLaunch: this.state.isAutoLaunch ? "no" : "yes",
    });
    this.handleSetting("isAutoLaunch");
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
                  case "isMergeWord":
                    this.handleMergeWord();
                    break;
                  case "isOpenInMain":
                    this.handleOpenInMain();
                    break;
                  case "isAlwaysOnTop":
                    this.handleAlwaysOnTop();
                    break;
                  case "isAutoMaximizeWin":
                    this.handleMaximizeWin();
                    break;
                  case "isAutoLaunch":
                    this.handleAutoLaunch();
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
  handleResetMainPosition = () => {
    window
      .require("electron")
      .ipcRenderer.invoke("reset-main-position", "ping");
    toast.success(this.props.t("Reset successful"));
  };
  render() {
    return (
      <>
        {this.renderSwitchOption(generalSettingList)}

        {isElectron && (
          <>
            <div className="setting-dialog-new-title">
              <Trans>Change storage location</Trans>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {" "}
                <span
                  className="change-location-button"
                  onClick={() => {
                    const { ipcRenderer } = window.require("electron");
                    ipcRenderer.invoke("open-explorer-folder", {
                      path: this.state.storageLocation,
                      isFolder: true,
                    });
                  }}
                  style={{ marginRight: "10px" }}
                >
                  <Trans>Locate</Trans>
                </span>
                <span
                  className="change-location-button"
                  onClick={() => {
                    this.handleChangeLocation();
                  }}
                >
                  <Trans>Select</Trans>
                </span>
              </div>
            </div>
            <p className="setting-option-subtitle">
              <Trans>
                {
                  "Modify the storage location of the library, and the library will be moved to the new location. Please ensure that the new folder is empty"
                }
              </Trans>
            </p>
            <div className="setting-dialog-location-title">
              {this.state.storageLocation}
            </div>
          </>
        )}
        {this.state.storageLocation && (
          <>
            <div className="setting-dialog-new-title">
              <Trans>Switch Library</Trans>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {isElectron && (
                  <span
                    className="change-location-button"
                    onClick={() => {
                      const { ipcRenderer } = window.require("electron");
                      ipcRenderer.invoke("open-explorer-folder", {
                        path: this.state.storageLocation,
                        isFolder: true,
                      });
                    }}
                    style={{ marginRight: "10px" }}
                  >
                    <Trans>Locate</Trans>
                  </span>
                )}
                <span
                  className="change-location-button"
                  onClick={() => {
                    this.handleSwitchLibrary();
                  }}
                >
                  <Trans>Select</Trans>
                </span>
              </div>
            </div>
            <p className="setting-option-subtitle">
              <Trans>
                {
                  "Switch between multiple libraries without affecting the original library. For multi-device synchronization in the free version, please refer to the documentation"
                }
              </Trans>
            </p>
            <div className="setting-dialog-location-title">
              {this.state.storageLocation}
            </div>
          </>
        )}
        <div className="setting-dialog-new-title">
          <Trans>Reset main window's position</Trans>

          <span
            className="change-location-button"
            onClick={() => {
              this.handleResetMainPosition();
            }}
          >
            <Trans>Reset</Trans>
          </span>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Select update channel</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            onChange={(event) => {
              ConfigService.setReaderConfig(
                "updateChannel",
                event.target.value
              );
              toast.success(this.props.t("Change successful"));
            }}
          >
            {[
              { value: "dev", label: "Developer version" },
              { value: "stable", label: "Stable version" },
            ].map((item) => (
              <option
                value={item.value}
                key={item.value}
                className="lang-setting-option"
                selected={
                  item.value === ConfigService.getReaderConfig("updateChannel")
                }
              >
                {this.props.t(item.label)}
              </option>
            ))}
          </select>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Language</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            onChange={(event) => {
              this.changeLanguage(event.target.value);
            }}
          >
            {langList.map((item) => (
              <option
                value={item.value}
                key={item.value}
                className="lang-setting-option"
                selected={
                  item.value === (ConfigService.getReaderConfig("lang") || "en")
                    ? true
                    : false
                }
              >
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Default search engine</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            onChange={(event) => {
              this.changeSearch(event.target.value);
            }}
          >
            {searchList.map((item) => (
              <option
                value={item.value}
                key={item.value}
                className="lang-setting-option"
                selected={
                  item.value ===
                  (ConfigService.getReaderConfig("searchEngine") ||
                    (navigator.language === "zh-CN" ? "baidu" : "google"))
                    ? true
                    : false
                }
              >
                {this.props.t(item.label)}
              </option>
            ))}
          </select>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Clear all data</Trans>
          <span
            className="change-location-button"
            onClick={async () => {
              let answer = await vexPromptAsync(
                this.props.t("Please type 'CLEAR' to confirm"),
                "",
                ""
              );
              window.vex.closeAll(); // 关闭对话框
              if (answer === "CLEAR") {
                await clearAllData();
                toast.success(this.props.t("Clear successful"));
                setTimeout(() => {
                  reloadManager();
                }, 300);
              } else if (answer) {
                toast.error(this.props.t("Please type 'CLEAR' to confirm"));
              }
            }}
          >
            <Trans>Clear</Trans>
          </span>
        </div>
      </>
    );
  }
}

export default GeneralSetting;
