import React, { useEffect, useRef, useState } from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import {
  clearAllData,
  confirmBrowserExtensionAsync,
  generateSyncRecord,
  getStorageLocation,
  getWebsiteLang,
  getWebsiteUrl,
  reloadManager,
  vexComfirmAsync,
  vexOpenAsync,
  vexPromptAsync,
} from "../../../utils/common";

import toast from "react-hot-toast";
import { isElectron } from "react-device-detect";
import { LocalFileManager } from "../../../utils/file/localFile";
import {
  ConfigService,
  KOReaderUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import { changeLibrary, changePath } from "../../../utils/file/common";
import SwitchRow from "../../../components/readerSettings/switchRow";
import { getSnapshots } from "../../../utils/file/backup";
import { restoreFromSnapshot } from "../../../utils/file/restore";
import {
  exportBooks,
  exportDictionaryHistory,
  exportHighlights,
  exportNotes,
} from "../../../utils/file/export";
import { importNotesData } from "../../../utils/file/importData";
import DatabaseService from "../../../utils/storage/databaseService";
import {
  dataSettingList,
  noteSyncSettingList,
  wordSyncSettingList,
} from "../../../constants/settingList";
import TokenService from "../../../utils/storage/tokenService";
declare var window: any;
const DataSetting = (props: SettingInfoProps) => {
  const [state, setStateObj] = useState<SettingInfoState>(() => ({
    storageLocation: getStorageLocation() || "",
    snapshotList: [],
    ttsCacheSize: "",
    tempCacheSize: "",
    exportNotesFormat: "",
    exportHighlightsFormat: "",
    exportWordsFormat: "",
    isEnableDiscordRPC:
      ConfigService.getReaderConfig("isEnableDiscordRPC") === "yes",
    isEnableKoReaderSync:
      ConfigService.getReaderConfig("isEnableKoReaderSync") === "yes",
    isEnableNotionSync:
      ConfigService.getReaderConfig("isEnableNotionSync") === "yes",
    isEnableYuqueSync:
      ConfigService.getReaderConfig("isEnableYuqueSync") === "yes",
    isEnableReadwiseSync:
      ConfigService.getReaderConfig("isEnableReadwiseSync") === "yes",
    isEnableMarkdownSync:
      ConfigService.getReaderConfig("isEnableMarkdownSync") === "yes",
    isEnableEudicSync:
      ConfigService.getReaderConfig("isEnableEudicSync") === "yes",
    isEnableAnkiSync:
      ConfigService.getReaderConfig("isEnableAnkiSync") === "yes",
    isEnableSiYuanSync:
      ConfigService.getReaderConfig("isEnableSiYuanSync") === "yes",
  }));
  const stateRef = useRef<SettingInfoState>(state);
  const setState = (
    patch:
      | Partial<SettingInfoState>
      | ((prev: SettingInfoState) => Partial<SettingInfoState>)
  ) => {
    const prev = stateRef.current;
    const partial =
      typeof patch === "function"
        ? (patch as (prev: SettingInfoState) => Partial<SettingInfoState>)(
            prev
          )
        : patch;
    const next = { ...prev, ...partial };
    stateRef.current = next;
    setStateObj(next);
  };

  useEffect(() => {
    const init = async () => {
      if (!isElectron) {
        const status = await LocalFileManager.getPermissionStatus();
        setState({
          storageLocation: status.directoryName || "",
          snapshotList: [],
        });
      }
      if (isElectron) {
        setState({
          snapshotList: getSnapshots(),
        });
        loadCacheSizes();
      }
    };
    init();
  }, []);
  const getCacheSizeLabel = (bytes: number): string => {
    if (!bytes || bytes <= 0) {
      return "0 MB";
    }
    const megaBytes = bytes / 1024 / 1024;
    if (megaBytes >= 1024) {
      return (megaBytes / 1024).toFixed(2) + " GB";
    }
    return megaBytes.toFixed(1) + " MB";
  };
  const loadCacheSizes = async () => {
    if (!isElectron || !window.electronAPI) {
      return;
    }
    try {
      const ttsSize = await window.electronAPI.invoke("get-cache-size", {
        type: "tts",
      });
      const tempSize = await window.electronAPI.invoke("get-cache-size", {
        type: "temp",
      });
      setState({
        ttsCacheSize: getCacheSizeLabel(ttsSize),
        tempCacheSize: getCacheSizeLabel(tempSize),
      });
    } catch (error) {
      console.error("Error loading cache sizes:", error);
    }
  };
  const handleClearTTSCache = async () => {
    try {
      await window.electronAPI.invoke("clear-tts", {});
      toast.success(props.t("Clear successful"));
    } catch (error) {
      toast.error(props.t("Clear failed"));
    }
    loadCacheSizes();
  };
  const handleClearTempCache = async () => {
    try {
      await window.electronAPI.invoke("clear-temp-cache", {});
      toast.success(props.t("Clear successful"));
    } catch (error) {
      toast.error(props.t("Clear failed"));
    }
    loadCacheSizes();
  };
  const handleSetting = (stateName: string) => {
    const currentValue = stateRef.current[stateName];
    setState({ [stateName]: !currentValue } as any);
    ConfigService.setReaderConfig(stateName, currentValue ? "no" : "yes");
    toast.success(props.t("Change successful"));
  };

  const handleKOReaderSyncSetting = async () => {
    const currentlyEnabled = stateRef.current.isEnableKoReaderSync;
    if (currentlyEnabled) {
      setState({ isEnableKoReaderSync: false });
      ConfigService.setReaderConfig("isEnableKoReaderSync", "no");
      toast.success(props.t("Change successful"));
      return;
    }

    if (!isElectron) {
      if (!(await confirmBrowserExtensionAsync())) {
        return;
      }
    }

    const savedConfig =
      ConfigService.getObjectConfig(
        "koReaderSyncConfig",
        "thirdpartyToken",
        {}
      ) || {};
    const labels = {
      serverUrl: props.t("Server address"),
      username: props.t("Username"),
      password: props.t("Password"),
    };
    const result = await vexOpenAsync(
      {
        serverUrl: {
          value: savedConfig.serverUrl || "",
          placeholder: "https://sync.koreader.rocks",
          type: "text",
        },
        username: {
          value: savedConfig.username || "",
          placeholder: props.t("Enter username"),
          type: "text",
        },
        password: {
          value: "",
          placeholder:
            savedConfig.passwordHash && savedConfig.username
              ? props.t("Leave blank to keep the current password")
              : props.t("Enter password"),
          type: "password",
        },
      },
      "",
      labels,
      getWebsiteUrl() + getWebsiteLang() + "/add-thirdparty"
    );

    if (!result) {
      return;
    }

    if (!result.serverUrl || !result.username) {
      toast.error(props.t("Please fill in all fields"));
      return;
    }
    if (!result.password && !savedConfig.passwordHash) {
      toast.error(props.t("Please fill in all fields"));
      return;
    }

    try {
      toast.loading(props.t("Validating server info..."), {
        id: "ko-reader-sync",
      });
      const koReaderUtil = new KOReaderUtil(
        ConfigService,
        TokenService,
        DatabaseService
      );
      const verifiedConfig =
        await koReaderUtil.verifyAndBuildKOReaderSyncConfig({
          serverUrl: result.serverUrl,
          username: result.username,
          password: result.password,
          passwordHash:
            !result.password && savedConfig.username === result.username
              ? savedConfig.passwordHash
              : "",
        });
      ConfigService.setObjectConfig(
        "koReaderSyncConfig",
        verifiedConfig,
        "thirdpartyToken"
      );
      setState({ isEnableKoReaderSync: true });
      ConfigService.setReaderConfig("isEnableKoReaderSync", "yes");
      toast.success(props.t("Validation successful"), {
        id: "ko-reader-sync",
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : props.t("Validation failed"),
        {
          id: "ko-reader-sync",
        }
      );
    }
  };

  const handleDataSetting = async (item: any) => {
    if (item.propName === "isEnableKoReaderSync") {
      await handleKOReaderSyncSetting();
      return;
    }
    handleSetting(item.propName);
  };

  const handleNoteSyncSetting = async (item: any) => {
    const currentlyEnabled = stateRef.current[item.propName];

    if (!currentlyEnabled && item.requiresAuth) {
      if (!isElectron) {
        if (!(await confirmBrowserExtensionAsync())) {
          return;
        }
      }

      // Special case: Markdown sync uses a folder picker in Electron
      if (item.propName === "isEnableMarkdownSync" && isElectron) {
        const ipcRenderer = window.electronAPI;
        const folder = await ipcRenderer.invoke("select-path");
        if (!folder) return;
        ConfigService.setObjectConfig(
          item.authConfigKey,
          { folder: folder },
          "thirdpartyToken"
        );
        setState({ [item.propName]: true } as any);
        ConfigService.setReaderConfig(item.propName, "yes");
        toast.success(props.t("Change successful"));
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
          savedValues[field.key] ?? "[" + props.t(field.placeholder) + "]";
        labelsMap[field.key] = props.t(field.label);
      }

      const result = await vexOpenAsync(
        defaultValues,
        "",
        labelsMap,
        getWebsiteUrl() + getWebsiteLang() + "/add-thirdparty"
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
        toast.error(props.t("Please fill in all fields"));
        return;
      }

      // Save auth config
      ConfigService.setObjectConfig(
        item.authConfigKey,
        result,
        "thirdpartyToken"
      );

      // Enable the setting
      setState({ [item.propName]: true } as any);
      ConfigService.setReaderConfig(item.propName, "yes");
      toast.success(props.t("Change successful"));
    } else {
      // Disabling: just toggle off
      setState({ [item.propName]: false } as any);
      ConfigService.setReaderConfig(item.propName, "no");
      toast.success(props.t("Change successful"));
    }
  };

  const renderNoteSyncOptions = () => {
    return noteSyncSettingList.map((item) => {
      return (
        <div
          style={item.isElectron ? (isElectron ? {} : { display: "none" }) : {}}
          key={item.propName}
        >
          <SwitchRow
            variant="setting"
            title={<Trans>{item.title}</Trans>}
            isEnabled={stateRef.current[item.propName]}
            onClick={() => {
              handleNoteSyncSetting(item);
            }}
          />
          <p className="setting-option-subtitle">
            <Trans>{item.desc}</Trans>
          </p>
          {item.propName === "isEnableMarkdownSync" &&
            stateRef.current[item.propName] &&
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

  const renderWordSyncOptions = () => {
    return wordSyncSettingList.map((item) => {
      return (
        <div key={item.propName}>
          <SwitchRow
            variant="setting"
            title={<Trans>{item.title}</Trans>}
            isEnabled={stateRef.current[item.propName]}
            onClick={() => {
              handleNoteSyncSetting(item);
            }}
          />
          <p className="setting-option-subtitle">
            <Trans>{item.desc}</Trans>
          </p>
        </div>
      );
    });
  };

  const renderSwitchOption = (optionList: any[]) => {
    return optionList.map((item) => {
      return (
        <div
          style={item.isElectron ? (isElectron ? {} : { display: "none" }) : {}}
          key={item.propName}
        >
          <SwitchRow
            variant="setting"
            title={<Trans>{item.title}</Trans>}
            isEnabled={stateRef.current[item.propName]}
            onClick={() => {
              handleDataSetting(item);
            }}
          />
          <p className="setting-option-subtitle">
            <Trans>{item.desc}</Trans>
          </p>
        </div>
      );
    });
  };

  const handleChangeLocation = async () => {
    const ipcRenderer = window.electronAPI;
    const newPath = await ipcRenderer.invoke("select-path");
    if (!newPath) {
      return;
    }
    let isSuccess = await changePath(newPath);
    if (!isSuccess) {
      toast.error(props.t("Change failed"));
      return;
    }
    ConfigService.setItem("storageLocation", newPath);
    setState({ storageLocation: newPath });
    let targetDrive = ConfigService.getItem("defaultSyncOption");
    await ipcRenderer.invoke("cloud-close", {
      service: targetDrive,
    });

    toast.success(props.t("Change successful"));
    props.handleFetchBooks();
  };
  const handleSwitchLibrary = async () => {
    if (isElectron) {
      const ipcRenderer = window.electronAPI;
      const newPath = await ipcRenderer.invoke("select-path");
      if (!newPath) {
        return;
      }
      let isSuccess = await changeLibrary(newPath);
      if (!isSuccess) {
        toast.error(props.t("Switch failed"));
        return;
      }
      ConfigService.setItem("storageLocation", newPath);
      setState({ storageLocation: newPath });
      try {
        let fs = window.electronAPI.fs;
        let text = fs.readFileSync(
          window.electronAPI.path.join(newPath, "config", "config.json"),
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
      toast.success(props.t("Switch successful"));
      props.handleFetchBooks();
      await generateSyncRecord();
      setTimeout(() => {
        props.history.push("/manager/home");
      }, 2000);
    } else {
      try {
        const directoryHandle = await LocalFileManager.requestDirectoryAccess();

        if (directoryHandle) {
          // 成功获取权限
          ConfigService.setItem("isUseLocal", "yes");
          setState({
            storageLocation: directoryHandle.name,
          });
          toast.success(
            props.t("Local folder access granted successfully")
          );
          props.handleFetchBooks();
          setTimeout(() => {
            props.history.push("/manager/home");
          }, 2000);
        } else {
          toast.success(props.t("Failed to get folder access permission"));
        }
      } catch (error) {
        toast.error(
          "Error selecting folder:" +
            (error instanceof Error ? error.message : String(error))
        );
        console.error("Error selecting folder:", error);
        toast.success(props.t("Error occurred while selecting folder"));
      }
    }
  };
  const handleRestoreSnapshot = async (event: any) => {
    let targetFile = event.target.value;
    if (!targetFile) {
      return;
    }
    let confirm = await vexComfirmAsync(
      props.t(
        "Restoring from a snapshot will overwrite your current data. Are you sure you want to continue?"
      )
    );
    if (!confirm) {
      return;
    }
    let result = await restoreFromSnapshot(targetFile);
    if (result) {
      toast.success(props.t("Restore successful"), {
        id: "restore-snapshot",
      });
      props.handleFetchBooks();
      setTimeout(() => {
        props.history.push("/manager/home");
      }, 2000);
    }
    event.target.value = "";
  };
  const handleImportNotesData = async () => {
    const result = await importNotesData();
    if (result === "cancel" || result === "failed") {
      return;
    }
    const { imported, skipped } = result as {
      imported: number;
      skipped: number;
    };
    toast.success(
      props.t(
        "Imported {{imported}} records, skipped {{skipped}} existing records",
        { imported, skipped }
      )
    );
    props.handleFetchBooks();
  };
  const render = () => {
    return (
      <>
        {renderSwitchOption(dataSettingList)}
        {renderNoteSyncOptions()}
        {renderWordSyncOptions()}
        {isElectron && (
          <>
            <div className="setting-dialog-new-title">
              <Trans>Change storage location</Trans>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {" "}
                <span
                  className="change-location-button"
                  onClick={() => {
                    const ipcRenderer = window.electronAPI;
                    ipcRenderer.invoke("open-explorer-folder", {
                      path: stateRef.current.storageLocation,
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
                    handleChangeLocation();
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
              {stateRef.current.storageLocation}
            </div>
          </>
        )}
        {stateRef.current.storageLocation && (
          <>
            <div className="setting-dialog-new-title">
              <Trans>Switch Library</Trans>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {isElectron && (
                  <span
                    className="change-location-button"
                    onClick={() => {
                      const ipcRenderer = window.electronAPI;
                      ipcRenderer.invoke("open-explorer-folder", {
                        path: stateRef.current.storageLocation,
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
                    handleSwitchLibrary();
                  }}
                >
                  <Trans>Select</Trans>
                </span>
              </div>
            </div>
            <p className="setting-option-subtitle">
              <Trans>
                {
                  "Switch between multiple libraries without affecting the original library."
                }
              </Trans>
            </p>
            <div className="setting-dialog-location-title">
              {stateRef.current.storageLocation}
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
                onChange={handleRestoreSnapshot}
              >
                <option value={""} className="lang-setting-option">
                  {props.t("Please select")}
                </option>
                {stateRef.current.snapshotList
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
                const result = await exportBooks(books);
                if (result === "success") {
                  toast.success(props.t("Export successful"), { id: "exporting" });
                } else if (result === "failed") {
                  toast.dismiss("exporting");
                  toast.error(props.t("Failed to export"), { id: "exporting" });
                }
              } else {
                toast(props.t("Nothing to export"));
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
            value={stateRef.current.exportNotesFormat}
            onChange={async (event) => {
              const fmt = event.target.value as
                | "csv"
                | "md"
                | "txt"
                | "html"
                | "pdf"
                | "json"
                | "";
              if (!fmt) return;
              setState({ exportNotesFormat: "" });
              let books = await DatabaseService.getAllRecords("books");
              let notes = await DatabaseService.getAllRecords("notes");
              notes = notes.filter(
                (note: any) =>
                  note.notes &&
                  note.notes.length > 0 &&
                  note.notes !== "annotation"
              );
              if (notes.length > 0) {
                const result = await exportNotes(notes, books, fmt);
                if (result === "success") {
                  toast.success(props.t("Export successful"), { id: "exporting" });
                } else if (result === "failed") {
                  toast.error(props.t("Failed to export"), { id: "exporting" });
                }
              } else {
                toast(props.t("Nothing to export"));
              }
            }}
          >
            <option value="" className="lang-setting-option">
              {props.t("Select format")}
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
            <option value="json" className="lang-setting-option">
              JSON
            </option>
          </select>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Export all highlights</Trans>
          <select
            className="lang-setting-dropdown"
            value={stateRef.current.exportHighlightsFormat}
            onChange={async (event) => {
              const fmt = event.target.value as
                | "csv"
                | "md"
                | "txt"
                | "html"
                | "pdf"
                | "json"
                | "";
              if (!fmt) return;
              setState({ exportHighlightsFormat: "" });
              let books = await DatabaseService.getAllRecords("books");
              let notes = await DatabaseService.getAllRecords("notes");
              notes = notes.filter((note: any) => note.notes === "");
              if (notes.length > 0) {
                const result = await exportHighlights(notes, books, fmt);
                if (result === "success") {
                  toast.success(props.t("Export successful"), { id: "exporting" });
                } else if (result === "failed") {
                  toast.error(props.t("Failed to export"), { id: "exporting" });
                }
              } else {
                toast(props.t("Nothing to export"));
              }
            }}
          >
            <option value="" className="lang-setting-option">
              {props.t("Select format")}
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
            <option value="json" className="lang-setting-option">
              JSON
            </option>
          </select>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Export all dictionary history</Trans>
          <select
            className="lang-setting-dropdown"
            value={stateRef.current.exportWordsFormat}
            onChange={async (event) => {
              const fmt = event.target.value as "csv" | "json" | "";
              if (!fmt) return;
              setState({ exportWordsFormat: "" });
              let dictHistory = await DatabaseService.getAllRecords("words");
              let books = await DatabaseService.getAllRecords("books");
              if (dictHistory.length > 0) {
                const result = await exportDictionaryHistory(dictHistory, books, fmt);
                if (result === "success") {
                  toast.success(props.t("Export successful"), { id: "exporting" });
                } else if (result === "failed") {
                  toast.error(props.t("Failed to export"), { id: "exporting" });
                }
              } else {
                toast(props.t("Nothing to export"));
              }
            }}
          >
            <option value="" className="lang-setting-option">
              {props.t("Select format")}
            </option>
            <option value="csv" className="lang-setting-option">
              CSV
            </option>
            <option value="json" className="lang-setting-option">
              JSON
            </option>
          </select>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Import notes, highlights and dictionary history</Trans>
          <span
            className="change-location-button"
            onClick={handleImportNotesData}
          >
            <Trans>Select</Trans>
          </span>
        </div>
        <p className="setting-option-subtitle">
          <Trans>
            {
              "Select previously exported CSV or JSON files to import notes, highlights and dictionary history back to the library"
            }
          </Trans>
        </p>
        <div className="setting-dialog-new-title">
          <Trans>Clear all data</Trans>
          <span
            className="change-location-button"
            onClick={async () => {
              let answer = await vexPromptAsync(
                props.t("Please type 'CLEAR' to confirm"),
                "",
                ""
              );
              window.vex.closeAll(); // 关闭对话框
              if (answer === "CLEAR") {
                await clearAllData();
                toast.success(props.t("Clear successful"));
                setTimeout(() => {
                  reloadManager();
                }, 300);
              } else if (answer) {
                toast.error(props.t("Please type 'CLEAR' to confirm"));
              }
            }}
          >
            <Trans>Clear</Trans>
          </span>
        </div>
        {isElectron && (
          <>
            <div className="setting-dialog-new-title">
              <Trans>Clear TTS cache</Trans>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <span
                  id="tts-cache-size"
                  style={{ marginRight: "10px", opacity: 0.6, fontSize: 13 }}
                >
                  {stateRef.current.ttsCacheSize}
                </span>
                <span
                  className="change-location-button"
                  onClick={handleClearTTSCache}
                >
                  <Trans>Clear</Trans>
                </span>
              </div>
            </div>
            <p className="setting-option-subtitle">
              <Trans>
                {
                  "Cached listen-book audio is stored locally and reused across sessions. Clearing it only frees up disk space"
                }
              </Trans>
            </p>
            <div className="setting-dialog-new-title">
              <Trans>Clear temp cache</Trans>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <span
                  id="temp-cache-size"
                  style={{ marginRight: "10px", opacity: 0.6, fontSize: 13 }}
                >
                  {stateRef.current.tempCacheSize}
                </span>
                <span
                  className="change-location-button"
                  onClick={handleClearTempCache}
                >
                  <Trans>Clear</Trans>
                </span>
              </div>
            </div>
            <p className="setting-option-subtitle">
              <Trans>
                {
                  "Cached comic extraction files, OCR results and full-text translations are stored locally and reused across sessions. Clearing them only frees up disk space"
                }
              </Trans>
            </p>
          </>
        )}
      </>
    );
  };

  return render();
};

export default DataSetting;
