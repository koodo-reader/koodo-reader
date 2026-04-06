import React from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import {
  clearAllData,
  generateSyncRecord,
  getStorageLocation,
  reloadManager,
  vexComfirmAsync,
  vexPromptAsync,
} from "../../../utils/common";

import toast from "react-hot-toast";
import { isElectron } from "react-device-detect";
import { LocalFileManager } from "../../../utils/file/localFile";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { changeLibrary, changePath } from "../../../utils/file/common";
import { getSnapshots } from "../../../utils/file/backup";
import { restoreFromSnapshot } from "../../../utils/file/restore";

declare var window: any;
class DataSetting extends React.Component<SettingInfoProps, SettingInfoState> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      storageLocation: getStorageLocation() || "",
      snapshotList: [],
    };
  }
  async componentDidMount() {
    if (!isElectron) {
      const status = await LocalFileManager.getPermissionStatus();
      this.setState({
        storageLocation: status.directoryName || "",
        snapshotList: [],
      });
    }
    if (isElectron) {
      this.setState({
        snapshotList: getSnapshots(),
      });
    }
  }
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
      try {
        let fs = window.require("fs");
        let text = fs.readFileSync(
          window.require("path").join(newPath, "config", "config.json"),
          "utf-8"
        );
        let config = JSON.parse(text);
        for (let key in config) {
          ConfigService.setItem(key, config[key]);
        }
      } catch (error) {
        console.error("Error reading config.json:", error);
      }

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
        toast.error(
          "Error selecting folder:" +
            (error instanceof Error ? error.message : String(error))
        );
        console.error("Error selecting folder:", error);
        toast.success(this.props.t("Error occurred while selecting folder"));
      }
    }
  };
  handleRestoreSnapshot = async (event: any) => {
    let targetFile = event.target.value;
    if (!targetFile) {
      return;
    }
    let confirm = await vexComfirmAsync(
      this.props.t(
        "Restoring from a snapshot will overwrite your current data. Are you sure you want to continue?"
      )
    );
    if (!confirm) {
      return;
    }
    let result = await restoreFromSnapshot(targetFile);
    if (result) {
      toast.success(this.props.t("Restore successful"), {
        id: "restore-snapshot",
      });
      this.props.handleFetchBooks();
      setTimeout(() => {
        this.props.history.push("/manager/home");
      }, 2000);
    }
    event.target.value = "";
  };
  render() {
    return (
      <>
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
        {isElectron && (
          <>
            <div className="setting-dialog-new-title">
              <Trans>Restore from snapshots</Trans>
              <select
                name=""
                className="lang-setting-dropdown"
                onChange={this.handleRestoreSnapshot}
              >
                <option value={""} className="lang-setting-option">
                  {this.props.t("Please select")}
                </option>
                {this.state.snapshotList
                  .map((item) => {
                    return {
                      label: new Date(item.time).toLocaleString(),
                      value: item.file,
                    };
                  })
                  .map((item) => (
                    <option
                      value={item.value}
                      key={item.value}
                      className="lang-setting-option"
                    >
                      {item.label}
                    </option>
                  ))}
              </select>
            </div>
            <p className="setting-option-subtitle">
              <Trans>
                {
                  "Each time you open Koodo Reader, it automatically creates a snapshot of your library (excluding books and covers). You can use these snapshots to restore your library to a previous state. Please note that restoring from a snapshot will overwrite your current data"
                }
              </Trans>
            </p>
          </>
        )}
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

export default DataSetting;
