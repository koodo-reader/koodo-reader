import React from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import {
  clearAllData,
  generateSyncRecord,
  getStorageLocation,
  reloadManager,
  vexComfirmAsync,
  vexOpenAsync,
  vexPromptAsync,
} from "../../../utils/common";

import toast from "react-hot-toast";
import { isElectron } from "react-device-detect";
import { LocalFileManager } from "../../../utils/file/localFile";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { changeLibrary, changePath } from "../../../utils/file/common";
import { getSnapshots } from "../../../utils/file/backup";
import { restoreFromSnapshot } from "../../../utils/file/restore";
import {
  exportBooks,
  exportDictionaryHistory,
  exportHighlights,
  exportNotes,
} from "../../../utils/file/export";
import DatabaseService from "../../../utils/storage/databaseService";
import {
  dataSettingList,
  noteSyncSettingList,
} from "../../../constants/settingList";
declare var window: any;
class DataSetting extends React.Component<SettingInfoProps, SettingInfoState> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      storageLocation: getStorageLocation() || "",
      snapshotList: [],
      exportNotesFormat: "",
      exportHighlightsFormat: "",
      isEnableDiscordRPC:
        ConfigService.getReaderConfig("isEnableDiscordRPC") === "yes",
      isEnableNotionSync:
        ConfigService.getReaderConfig("isEnableNotionSync") === "yes",
      isEnableYuqueSync:
        ConfigService.getReaderConfig("isEnableYuqueSync") === "yes",
      isEnableReadwiseSync:
        ConfigService.getReaderConfig("isEnableReadwiseSync") === "yes",
      isEnableMarkdownSync:
        ConfigService.getReaderConfig("isEnableMarkdownSync") === "yes",
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
  handleSetting = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any);
    ConfigService.setReaderConfig(
      stateName,
      this.state[stateName] ? "no" : "yes"
    );
    toast.success(this.props.t("Change successful"));
  };

  handleNoteSyncSetting = async (item: any) => {
    const currentlyEnabled = this.state[item.propName];

    if (!currentlyEnabled && item.requiresAuth) {
      // Special case: Markdown sync uses a folder picker in Electron
      if (item.propName === "isEnableMarkdownSync" && isElectron) {
        const { ipcRenderer } = window.require("electron");
        const folder = await ipcRenderer.invoke("select-path");
        if (!folder) return;
        ConfigService.setObjectConfig(
          item.authConfigKey,
          { folder: folder },
          "thirdpartyToken"
        );
        this.setState({ [item.propName]: true } as any);
        ConfigService.setReaderConfig(item.propName, "yes");
        toast.success(this.props.t("Change successful"));
        return;
      }

      // Enabling: prompt for auth credentials
      const existingConfig = ConfigService.getObjectConfig(
        item.authConfigKey,
        "thirdpartyToken",
        {}
      );
      let savedValues: Record<string, any> = {};
      if (existingConfig && Object.keys(existingConfig).length > 0) {
        savedValues = existingConfig;
      }
      // Build defaultValues record: key -> saved value or placeholder
      const defaultValues: Record<string, any> = {};
      const labelsMap: Record<string, string> = {};
      for (const field of item.authFields as Array<{
        key: string;
        label: string;
        placeholder: string;
      }>) {
        defaultValues[field.key] =
          savedValues[field.key] ?? "[" + this.props.t(field.placeholder) + "]";
        labelsMap[field.key] = this.props.t(field.label);
      }

      const result = await vexOpenAsync(
        defaultValues,
        item.title + "\nPlease enter your credentials to enable sync:",
        labelsMap
      );

      if (!result) {
        // User cancelled
        return;
      }

      // Validate that all fields are filled
      const allFilled = Object.values(result).every(
        (v) => v && String(v).trim().length > 0
      );
      if (!allFilled) {
        toast.error(this.props.t("Please fill in all fields"));
        return;
      }

      // Save auth config
      ConfigService.setObjectConfig(
        item.authConfigKey,
        result,
        "thirdpartyToken"
      );

      // Enable the setting
      this.setState({ [item.propName]: true } as any);
      ConfigService.setReaderConfig(item.propName, "yes");
      toast.success(this.props.t("Change successful"));
    } else {
      // Disabling: just toggle off
      this.setState({ [item.propName]: false } as any);
      ConfigService.setReaderConfig(item.propName, "no");
      toast.success(this.props.t("Change successful"));
    }
  };

  renderNoteSyncOptions = () => {
    return noteSyncSettingList.map((item) => {
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
                this.handleNoteSyncSetting(item);
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
          {item.propName === "isEnableMarkdownSync" &&
            this.state[item.propName] &&
            isElectron &&
            (() => {
              let folder = "";

              const config = ConfigService.getObjectConfig(
                item.authConfigKey,
                "thirdpartyToken",
                {}
              );
              if (config && Object.keys(config).length > 0) {
                const parsed = config;
                folder = parsed["folder"] || "";
              }

              return folder ? (
                <div className="setting-dialog-location-title">{folder}</div>
              ) : null;
            })()}
        </div>
      );
    });
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
                this.handleSetting(item.propName);
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
    let targetDrive = ConfigService.getItem("defaultSyncOption");
    await ipcRenderer.invoke("cloud-close", {
      service: targetDrive,
    });

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
      let targetDrive = ConfigService.getItem("defaultSyncOption");
      await ipcRenderer.invoke("cloud-close", {
        service: targetDrive,
      });
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
        {this.renderSwitchOption(dataSettingList)}
        {this.renderNoteSyncOptions()}
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
          <Trans>Export all books</Trans>
          <span
            className="change-location-button"
            onClick={async () => {
              let books = await DatabaseService.getAllRecords("books");
              if (books.length > 0) {
                await exportBooks(books);
                toast.success(this.props.t("Export successful"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <Trans>Export</Trans>
          </span>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Export all notes</Trans>
          <select
            className="lang-setting-dropdown"
            value={this.state.exportNotesFormat}
            onChange={async (event) => {
              const fmt = event.target.value as
                | "csv"
                | "md"
                | "txt"
                | "html"
                | "pdf"
                | "";
              if (!fmt) return;
              this.setState({ exportNotesFormat: "" });
              let books = await DatabaseService.getAllRecords("books");
              let notes = await DatabaseService.getAllRecords("notes");
              notes = notes.filter(
                (note: any) => note.notes && note.notes.length > 0
              );
              if (notes.length > 0) {
                exportNotes(notes, books, fmt);
                toast.success(this.props.t("Export successful"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <option value="" className="lang-setting-option">
              {this.props.t("Select format")}
            </option>
            <option value="csv" className="lang-setting-option">
              CSV
            </option>
            <option value="md" className="lang-setting-option">
              Markdown
            </option>
            <option value="txt" className="lang-setting-option">
              TXT
            </option>
            <option value="html" className="lang-setting-option">
              HTML
            </option>
            <option value="pdf" className="lang-setting-option">
              PDF
            </option>
          </select>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Export all highlights</Trans>
          <select
            className="lang-setting-dropdown"
            value={this.state.exportHighlightsFormat}
            onChange={async (event) => {
              const fmt = event.target.value as
                | "csv"
                | "md"
                | "txt"
                | "html"
                | "pdf"
                | "";
              if (!fmt) return;
              this.setState({ exportHighlightsFormat: "" });
              let books = await DatabaseService.getAllRecords("books");
              let notes = await DatabaseService.getAllRecords("notes");
              notes = notes.filter((note: any) => note.notes === "");
              if (notes.length > 0) {
                exportHighlights(notes, books, fmt);
                toast.success(this.props.t("Export successful"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <option value="" className="lang-setting-option">
              {this.props.t("Select format")}
            </option>
            <option value="csv" className="lang-setting-option">
              CSV
            </option>
            <option value="md" className="lang-setting-option">
              Markdown
            </option>
            <option value="txt" className="lang-setting-option">
              TXT
            </option>
            <option value="html" className="lang-setting-option">
              HTML
            </option>
            <option value="pdf" className="lang-setting-option">
              PDF
            </option>
          </select>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Export all dictionary history</Trans>
          <span
            className="change-location-button"
            onClick={async () => {
              let dictHistory = await DatabaseService.getAllRecords("words");
              let books = await DatabaseService.getAllRecords("books");
              if (dictHistory.length > 0) {
                exportDictionaryHistory(dictHistory, books);
                toast.success(this.props.t("Export successful"));
              } else {
                toast(this.props.t("Nothing to export"));
              }
            }}
          >
            <Trans>Export</Trans>
          </span>
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

export default DataSetting;
