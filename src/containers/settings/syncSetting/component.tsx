import React, { useState } from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import i18n from "../../../i18n";
import { removeCloudConfig } from "../../../utils/file/common";
import { isElectron } from "react-device-detect";
import _ from "underscore";
import { syncSettingList } from "../../../constants/settingList";
import SwitchRow from "../../../components/readerSettings/switchRow";

import toast from "react-hot-toast";
import {
  confirmBrowserExtensionAsync,
  detectKoodoExtension,
  generateSyncRecord,
  getICloudDrivePath,
  getServerRegion,
  getWebsiteLang,
  getWebsiteUrl,
  handleContextMenu,
  openExternalUrl,
  openInBrowser,
  resetKoodoSync,
  showTaskProgress,
  testConnection,
  testCORS,
  vexComfirmAsync,
} from "../../../utils/common";

import { driveInputConfig, driveList } from "../../../constants/driveList";
import { backup } from "../../../utils/file/backup";
import { restore } from "../../../utils/file/restore";
import {
  ConfigService,
  KookitConfig,
  SyncHelper,
  SyncUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import {
  encryptToken,
  onSyncCallback,
} from "../../../utils/request/thirdparty";
import SyncService from "../../../utils/storage/syncService";
import { updateUserConfig } from "../../../utils/request/user";
import BookUtil from "../../../utils/file/bookUtil";
import Book from "../../../models/Book";
import ConfigUtil from "../../../utils/file/configUtil";
import TokenService from "../../../utils/storage/tokenService";
declare var window: any;

const SyncSetting = (props: SettingInfoProps) => {
  const [state, setState] = useState<SettingInfoState>(() => ({
    isKeepLocal: ConfigService.getReaderConfig("isKeepLocal") === "yes",
    autoOffline: ConfigService.getReaderConfig("autoOffline") === "yes",
    isDisableAutoSync:
      ConfigService.getReaderConfig("isDisableAutoSync") === "yes",
    isEnableKoodoSync:
      ConfigService.getReaderConfig("isEnableKoodoSync") === "yes",
    hideSyncProgress:
      ConfigService.getReaderConfig("hideSyncProgress") === "yes",
    driveConfig: {},
    scheduledSyncInterval:
      ConfigService.getReaderConfig("scheduledSyncInterval") || "",
    backupDrive: "",
    restoreDrive: "",
    showDefaultSyncAddGrid: false,
  }));

  const setPartialState = (partial: Partial<SettingInfoState>) => {
    setState((prevState) => ({ ...prevState, ...partial }));
  };

  const handleRest = (_bool: boolean) => {
    toast.success(props.t("Change successful"));
  };

  const handleJump = (url: string) => {
    openInBrowser(url);
  };

  const handleSetting = (stateName: string) => {
    const currentValue = (state as any)[stateName];
    setState(
      (prevState) =>
        ({
          ...prevState,
          [stateName]: !(prevState as any)[stateName],
        }) as any
    );
    ConfigService.setReaderConfig(stateName, currentValue ? "no" : "yes");
    handleRest(currentValue);
  };

  const handleAddDataSourceFromGrid = async (targetDrive: string) => {
    await handleAddDataSource({ target: { value: targetDrive } });
    if (props.settingDrive) {
      setPartialState({ showDefaultSyncAddGrid: false });
    }
  };

  const handleAddDataSource = async (event: any) => {
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
        props.t(
          "Koodo Reader's web version are limited by the browser, for more powerful features, please download the desktop version."
        )
      );
      return;
    }
    if (!props.isAuthed) {
      toast(props.t("Please upgrade to Pro to use this feature"));
      props.handleSetting(true);
      props.handleSettingMode("account");
      return;
    }
    if (
      !isElectron &&
      driveList.find((item) => item.value === targetDrive)?.needExtension
    ) {
      if (!(await confirmBrowserExtensionAsync())) {
        return;
      }
    }
    if (
      driveList.find((item) => item.value === targetDrive)?.isPro &&
      !props.isAuthed
    ) {
      toast(props.t("Please upgrade to Pro to use this feature"));
      props.handleSetting(true);
      props.handleSettingMode("account");
      return;
    }
    props.handleSettingDrive(targetDrive);
    let settingDrive = targetDrive;
    if (settingDrive === "icloud" || settingDrive === "folder") {
      let drivePath = "";
      if (settingDrive === "icloud") {
        drivePath = getICloudDrivePath();
        if (!drivePath) {
          toast.error(
            props.t(
              "Can't find Koodo Reader's folder in the default iCloud path, please make sure iCloud Drive is installed and set up correctly, and you have already synced your library to iCloud Drive on the iOS version first."
            ),
            {
              duration: 6000,
            }
          );
          props.handleSettingDrive("");
          return;
        }
      } else if (settingDrive === "folder") {
        const ipcRenderer = window.electronAPI;
        drivePath = await ipcRenderer.invoke("select-path");
        if (!drivePath) {
          toast.error(i18n.t("Please select a folder"));
          props.handleSettingDrive("");
          return;
        }
      }
      toast.loading(i18n.t("Adding"), { id: "adding-sync-id" });
      let res = await encryptToken(settingDrive, {
        drivePath: drivePath,
      });
      if (res.code === 200) {
        toast.success(i18n.t("Binding successful"), { id: "adding-sync-id" });
      } else {
        toast.error(i18n.t("Binding failed"), { id: "adding-sync-id" });
        props.handleSettingDrive("");
        return;
      }
      SyncService.removeSyncUtil(settingDrive);
      removeCloudConfig(settingDrive);
      if (isElectron) {
        const ipcRenderer = window.electronAPI;
        await ipcRenderer.invoke("cloud-close", {
          service: settingDrive,
        });
      }
      ConfigService.setListConfig(settingDrive, "dataSourceList");
      toast.success(i18n.t("Binding successful"), { id: "adding-sync-id" });
      if (
        props.isAuthed &&
        !ConfigService.getItem("defaultSyncOption") &&
        settingDrive !== "microsoft_exp"
      ) {
        ConfigService.setItem("defaultSyncOption", settingDrive);
        if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
          resetKoodoSync();
        }
        props.handleFetchDefaultSyncOption();
      }
      props.handleFetchDataSourceList();
      props.handleSettingDrive("");
      return;
    }
    if (
      settingDrive === "dropbox" ||
      settingDrive === "yandex" ||
      settingDrive === "dubox" ||
      settingDrive === "yiyiwu" ||
      settingDrive === "google" ||
      settingDrive === "boxnet" ||
      settingDrive === "pcloud" ||
      settingDrive === "adrive" ||
      settingDrive === "microsoft_exp" ||
      settingDrive === "microsoft"
    ) {
      handleJump(
        new SyncUtil(settingDrive, {}).getAuthUrl(
          getServerRegion() === "china" &&
            (settingDrive === "microsoft" ||
              settingDrive === "microsoft_exp" ||
              settingDrive === "dubox" ||
              settingDrive === "yiyiwu" ||
              settingDrive === "adrive")
            ? KookitConfig.ThirdpartyConfig.cnCallbackUrl
            : KookitConfig.ThirdpartyConfig.callbackUrl
        )
      );
    }
  };

  const handleDeleteDataSource = async (event: any) => {
    let targetDrive = event.target.value;
    if (!targetDrive) {
      return;
    }
    await TokenService.setToken(targetDrive + "_token", "");
    SyncService.removeSyncUtil(targetDrive);
    removeCloudConfig(targetDrive);
    if (isElectron) {
      const ipcRenderer = window.electronAPI;
      await ipcRenderer.invoke("cloud-close", {
        service: targetDrive,
      });
    }
    ConfigService.deleteListConfig(targetDrive, "dataSourceList");
    props.handleFetchDataSourceList();
    if (targetDrive === ConfigService.getItem("defaultSyncOption")) {
      ConfigService.removeItem("defaultSyncOption");
      props.handleFetchDefaultSyncOption();
      if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
        resetKoodoSync();
      }
    }
    toast.success(props.t("Deletion successful"));
  };

  const handleSetDefaultSyncOption = async (newValue: string) => {
    if (!newValue) {
      return;
    }
    if (!props.isAuthed) {
      toast(props.t("Please upgrade to Pro to use this feature"));
      props.handleSetting(true);
      props.handleSettingMode("account");
      return;
    }

    ConfigService.setItem("defaultSyncOption", newValue);
    if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
      resetKoodoSync();
    }
    props.handleFetchDefaultSyncOption();
    toast.success(props.t("Change successful"));
    if (
      !(await ConfigUtil.isCloudEmpty()) &&
      ConfigService.getReaderConfig("isEnableKoodoSync") === "yes"
    ) {
      toast(
        props.t(
          "This data source already contains a library. If you need to merge local and cloud data, please turn off Koodo Sync and resync."
        ),
        {
          duration: 10000,
        }
      );
    }
  };

  const handleSelectBackupOrRestoreSource = async (
    event: any,
    mode: "backup" | "restore"
  ) => {
    let targetDrive = event.target.value;
    if (!targetDrive) {
      setState((prevState) => ({
        ...prevState,
        backupDrive: mode === "backup" ? "" : prevState.backupDrive,
        restoreDrive: mode === "restore" ? "" : prevState.restoreDrive,
      }));
      return;
    }
    if (targetDrive === "add") {
      setPartialState({ showDefaultSyncAddGrid: true });
      return;
    }
    if (
      targetDrive !== "local" &&
      !driveList
        .find((item) => item.value === targetDrive)
        ?.support.includes("browser") &&
      !isElectron
    ) {
      toast(
        props.t(
          "Koodo Reader's web version are limited by the browser, for more powerful features, please download the desktop version."
        )
      );
      return;
    }
    if (
      driveList.find((item) => item.value === targetDrive)?.isPro &&
      !props.isAuthed
    ) {
      toast(props.t("Please upgrade to Pro to use this feature"));
      props.handleSetting(true);
      props.handleSettingMode("account");
      return;
    }
    setState((prevState) => ({
      ...prevState,
      backupDrive: mode === "backup" ? targetDrive : prevState.backupDrive,
      restoreDrive: mode === "restore" ? targetDrive : prevState.restoreDrive,
    }));
    if (mode === "backup") {
      handleBackupLibrary(targetDrive);
    } else {
      handleRestoreLibrary(targetDrive);
    }
  };

  const handleBackupLibrary = async (name: string) => {
    if (!name) {
      return;
    }
    if (name === "local") {
      let result = await backup(name);
      if (result === "cancel") {
        toast.dismiss("backup");
        return;
      }
      if (result === "success") {
        toast.dismiss("backup");
        toast.success(props.t("Execute successful"));
        props.handleFetchBooks();
        await generateSyncRecord();
      } else {
        toast.dismiss("backup");
        toast.error(props.t("Backup failed"));
      }
      return;
    }
    if (!(await TokenService.getToken(name + "_token"))) {
      props.handleTokenDialog(true);
      return;
    }
    toast.dismiss("backup");
    toast(props.t("Uploading, please wait"), {
      position: "bottom-center",
      id: "backup",
    });
    props.handleLoadingDialog(true);
    let result = await backup(name);
    if (result === "cancel") {
      props.handleLoadingDialog(false);
      toast.dismiss("backup");
      return;
    }
    if (result === "success") {
      props.handleLoadingDialog(false);
      toast.dismiss("backup");
      toast.success(props.t("Execute successful"));
      props.handleFetchBooks();
      await generateSyncRecord();
    } else {
      props.handleLoadingDialog(false);
      toast.dismiss("backup");
      toast.error(props.t("Upload failed, check your connection"));
    }
  };

  const handleRestoreLibrary = async (name: string) => {
    if (!name) {
      return;
    }
    if (name === "local") {
      let result = await restore(name);
      if (result === "cancel") {
        toast.dismiss("backup");
        return;
      }
      if (result === "success") {
        toast.dismiss("backup");
        toast.success(props.t("Execute successful"));
        props.handleFetchBooks();
        await generateSyncRecord();
        setTimeout(() => {
          props.history.push("/manager/home");
        }, 2000);
      } else {
        toast.dismiss("backup");
        toast.error(props.t("Download failed,network problem or no backup"));
      }
      return;
    }
    if (!(await TokenService.getToken(name + "_token"))) {
      props.handleTokenDialog(true);
      return;
    }
    props.handleLoadingDialog(true);
    toast.dismiss("backup");
    toast(props.t("Downloading, please wait"));
    let result = await restore(name);
    if (result === "cancel") {
      props.handleLoadingDialog(false);
      toast.dismiss("backup");
      return;
    }
    if (result === "success") {
      props.handleLoadingDialog(false);
      toast.dismiss("backup");
      toast.success(props.t("Execute successful"));
      props.handleFetchBooks();
      await generateSyncRecord();
      setTimeout(() => {
        props.history.push("/manager/home");
      }, 2000);
    } else {
      props.handleLoadingDialog(false);
      toast.dismiss("backup");
      toast.error(props.t("Download failed,network problem or no backup"));
    }
  };

  const handleCancelDrive = () => {
    props.handleSettingDrive("");
  };

  const checkCorsForDrive = async (): Promise<boolean> => {
    toast.loading(i18n.t("Testing connection..."), {
      id: "testing-connection-id",
    });
    let corsResult = await testCORS(state.driveConfig.url);
    if (!corsResult && !isElectron) {
      const extensionInfo = await detectKoodoExtension();
      if (extensionInfo.installed) {
        vexComfirmAsync(
          props.t(
            "Please click the Koodo Reader extension icon in the upper right corner of the browser, authorize the request to this endpoint, and try again"
          )
        );
      }
    }
    if (!corsResult) {
      toast.dismiss("testing-connection-id");
      return false;
    }
    toast.dismiss("testing-connection-id");
    return true;
  };

  const handleConfirmDrive = async () => {
    let flag = true;
    for (let item of driveInputConfig[props.settingDrive]) {
      if (!state.driveConfig[item.value] && item.required) {
        toast.error(props.t("Missing parameters") + ": " + props.t(item.label));
        flag = false;
        break;
      }
    }
    if (!flag) {
      return;
    }
    if (
      props.settingDrive === "webdav" ||
      props.settingDrive === "docker" ||
      props.settingDrive === "ftp" ||
      props.settingDrive === "sftp" ||
      props.settingDrive === "mega" ||
      props.settingDrive === "s3compatible"
    ) {
      toast.loading(i18n.t("Adding"), { id: "adding-sync-id" });
      let res = await encryptToken(props.settingDrive, state.driveConfig);
      if (res.code === 200) {
        ConfigService.setListConfig(props.settingDrive, "dataSourceList");
        toast.success(i18n.t("Binding successful"), { id: "adding-sync-id" });
      } else {
        toast.error(i18n.t("Binding failed"), { id: "adding-sync-id" });
      }
    } else {
      await onSyncCallback(props.settingDrive, state.driveConfig.token);
    }
    SyncService.removeSyncUtil(props.settingDrive);
    removeCloudConfig(props.settingDrive);
    if (isElectron) {
      const ipcRenderer = window.electronAPI;
      await ipcRenderer.invoke("cloud-close", {
        service: props.settingDrive,
      });
    }
    if (
      props.isAuthed &&
      !ConfigService.getItem("defaultSyncOption") &&
      props.settingDrive !== "microsoft_exp"
    ) {
      ConfigService.setItem("defaultSyncOption", props.settingDrive);
      if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
        resetKoodoSync();
      }
      props.handleFetchDefaultSyncOption();
    }
    props.handleFetchDataSourceList();
    props.handleSettingDrive("");
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
            isEnabled={(state as any)[item.propName]}
            onClick={async () => {
              switch (item.propName) {
                case "isEnableKoodoSync":
                  handleSetting(item.propName);
                  let encryptToken = await TokenService.getToken(
                    props.defaultSyncOption + "_token"
                  );
                  await updateUserConfig({
                    is_enable_koodo_sync:
                      ConfigService.getReaderConfig("isEnableKoodoSync"),
                    default_sync_option: props.defaultSyncOption,
                    default_sync_token: encryptToken || "",
                  });
                  let userInfo = await props.handleFetchUserInfo();
                  if (
                    ConfigService.getReaderConfig("isEnableKoodoSync") === "yes"
                  ) {
                    props.cloudSyncFunc(userInfo);
                  }

                  break;
                case "autoOffline":
                  handleSetting(item.propName);
                  if (!state.autoOffline) {
                    if (props.defaultSyncOption === "adrive") {
                      toast.error(
                        props.t(
                          "Due to Aliyun Drive's stringent concurrency restrictions, we have bypassed the synchronization of books and covers. Please manually download the books by clicking on them"
                        ),
                        { id: "autoOffline" }
                      );
                      return;
                    }
                    let downloadTasks = await SyncHelper.syncBook(
                      ConfigService,
                      BookUtil
                    );
                    let timer = await showTaskProgress((_: boolean) => {});
                    if (!timer) {
                      return;
                    }
                    await SyncHelper.runTasksWithLimit(
                      downloadTasks,
                      99,
                      ConfigService.getItem("defaultSyncOption")
                    );
                    clearInterval(timer);

                    toast.success(props.t("Download completed"), {
                      id: "autoOffline",
                    });

                    setTimeout(() => {
                      toast.dismiss("syncing");
                    }, 3000);
                  }

                  break;
                default:
                  handleSetting(item.propName);
                  break;
              }
            }}
          />
          <p className="setting-option-subtitle">
            <Trans>{item.desc}</Trans>
          </p>
        </div>
      );
    });
  };

  const { showDefaultSyncAddGrid } = state;
  return (
    <>
      <div
        className="add-source-card"
        onClick={() => {
          setState((prevState) => ({
            ...prevState,
            showDefaultSyncAddGrid: !prevState.showDefaultSyncAddGrid,
          }));
        }}
      >
        <svg
          className="add-source-card-icon"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: showDefaultSyncAddGrid
              ? "rotate(45deg)"
              : "rotate(0deg)",
            transition: "transform 0.25s ease",
          }}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="add-source-card-label">
          <Trans>Add data source</Trans>
        </span>
      </div>
      {state.showDefaultSyncAddGrid && (
        <div
          className="account-login-grid"
          style={{
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            marginLeft: "25px",
            marginRight: "25px",
            fontWeight: 500,
            marginBottom: "20px",
          }}
        >
          {driveList
            .filter((item) => !props.dataSourceList.includes(item.value))
            .filter((item) => {
              if (item.value === "microsoft_exp") {
                return false;
              }
              if (!isElectron) {
                return item.support.includes("browser");
              }
              return true;
            })
            .filter((item) => {
              if (
                isElectron &&
                window.electronAPI?.runtime?.platform !== "darwin" &&
                item.value === "icloud"
              ) {
                return false;
              }
              return true;
            })
            .map((item) => (
              <div
                className="account-login-option"
                key={item.value}
                onClick={() => {
                  handleAddDataSourceFromGrid(item.value);
                }}
              >
                <span className="account-login-option-label">
                  {props.t(item.label) + (item.isPro ? " (Pro)" : "")}
                </span>
              </div>
            ))}
        </div>
      )}
      {props.settingDrive && (
        <div
          className="voice-add-new-container"
          style={{
            marginLeft: "25px",
            width: "calc(100% - 50px)",
            fontWeight: 500,
          }}
        >
          {props.settingDrive === "webdav" ||
          props.settingDrive === "docker" ||
          props.settingDrive === "ftp" ||
          props.settingDrive === "sftp" ||
          props.settingDrive === "mega" ||
          props.settingDrive === "s3compatible" ? (
            <>
              {driveInputConfig[props.settingDrive].map((item) => {
                return (
                  <div key={item.value}>
                    <input
                      type={item.type}
                      name={item.value}
                      key={item.value}
                      placeholder={
                        props.t(item.label) +
                        (item.required ? "" : " (" + props.t("Optional") + ")")
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                          setState((prevState) => ({
                            ...prevState,
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
                    {item.value === "endpoint" ? (
                      <div
                        style={{
                          marginTop: "5px",
                          marginLeft: "2px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {props.t(
                          "This endpoint usually don't contain bucket name"
                        )}
                      </div>
                    ) : (
                      ""
                    )}
                    {item.example && (
                      <div
                        style={{
                          marginTop: "5px",
                          marginBottom: "2px",
                          marginLeft: "2px",
                          fontSize: "12px",
                          opacity: 0.8,
                        }}
                      >
                        {props.t("Example")}: {item.example}
                      </div>
                    )}
                    {item.note && (
                      <div
                        style={{
                          marginTop: "5px",
                          marginBottom: "2px",
                          marginLeft: "2px",
                          fontSize: "12px",
                          opacity: 0.8,
                        }}
                      >
                        {props.t(item.note)}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <>
              <textarea
                className="token-dialog-token-box"
                id="token-dialog-token-box"
                placeholder={props.t(
                  "Please click the authorize button below to authorize your account, enter the obtained credentials here, and then click the bind button below"
                )}
                onChange={(e) => {
                  if (e.target.value) {
                    setState((prevState) => ({
                      ...prevState,
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
          {props.settingDrive === "webdav" && !isElectron && (
            <div
              className="token-dialog-tip"
              style={{
                marginTop: "10px",
                fontSize: "13px",
                lineHeight: "16px",
                color: "rgba(231, 69, 69, 0.8)",
              }}
            >
              {props.t(
                "Only WebDAV service provided by Alist is directly supported in Browser, Other WebDAV services need to enable CORS to work properly. Also due to browser's security restrictions, the WebDAV service must be accessed via HTTPS protocol when you're visiting Koodo Reader via HTTPS protocol."
              )}
            </div>
          )}
          {props.settingDrive === "docker" && !isElectron && (
            <div
              className="token-dialog-tip"
              style={{
                marginTop: "10px",
                fontSize: "13px",
                lineHeight: "16px",
                color: "rgba(231, 69, 69, 0.8)",
              }}
            >
              {props.t(
                "The Koodo Reader Docker version does not support the data source feature by default. You need to modify the configuration parameters during deployment to manually enable it. Also due to browser's security restrictions, the Docker service must be accessed via HTTPS protocol when you're visiting Koodo Reader via HTTPS protocol."
              )}
            </div>
          )}
          {props.settingDrive === "s3compatible" && !isElectron && (
            <div
              className="token-dialog-tip"
              style={{
                marginTop: "10px",
                fontSize: "13px",
                lineHeight: "16px",
                color: "rgba(231, 69, 69, 0.8)",
              }}
            >
              {props.t(
                "Some S3 services are not compatible with browser environments. If you encounter connection issues, please refer to the service provider's official documentation for instructions on enabling CORS. Also due to browser's security restrictions, the S3 service must be accessed via HTTPS protocol when you're visiting Koodo Reader via HTTPS protocol."
              )}
            </div>
          )}
          <div className="token-dialog-button-container">
            <div
              className="voice-add-confirm"
              onClick={async () => {
                if (props.settingDrive === "webdav") {
                  if (!(await checkCorsForDrive())) {
                    return;
                  }
                }
                if (
                  props.settingDrive === "webdav" ||
                  props.settingDrive === "docker" ||
                  props.settingDrive === "ftp" ||
                  props.settingDrive === "sftp" ||
                  props.settingDrive === "mega" ||
                  props.settingDrive === "s3compatible"
                ) {
                  let connectionResult = await testConnection(
                    props.settingDrive,
                    state.driveConfig
                  );
                  if (!connectionResult) {
                    return;
                  }
                }
                handleConfirmDrive();
              }}
            >
              <Trans>Bind</Trans>
            </div>

            <div className="voice-add-button-container">
              <div
                className="voice-add-cancel"
                onClick={() => {
                  handleCancelDrive();
                }}
              >
                <Trans>Cancel</Trans>
              </div>
              {(props.settingDrive === "dropbox" ||
                props.settingDrive === "dubox" ||
                props.settingDrive === "yandex" ||
                props.settingDrive === "yiyiwu" ||
                props.settingDrive === "google" ||
                props.settingDrive === "boxnet" ||
                props.settingDrive === "pcloud" ||
                props.settingDrive === "adrive" ||
                props.settingDrive === "microsoft_exp" ||
                props.settingDrive === "microsoft") && (
                <div
                  className="voice-add-confirm"
                  style={{ marginRight: "10px" }}
                  onClick={async () => {
                    handleJump(
                      new SyncUtil(props.settingDrive, {}).getAuthUrl(
                        getServerRegion() === "china" &&
                          (props.settingDrive === "microsoft" ||
                            props.settingDrive === "microsoft_exp" ||
                            props.settingDrive === "dubox" ||
                            props.settingDrive === "yiyiwu" ||
                            props.settingDrive === "adrive")
                          ? KookitConfig.ThirdpartyConfig.cnCallbackUrl
                          : KookitConfig.ThirdpartyConfig.callbackUrl
                      )
                    );
                  }}
                >
                  <Trans>Authorize</Trans>
                </div>
              )}
              {(props.settingDrive === "webdav" ||
                props.settingDrive === "docker" ||
                props.settingDrive === "ftp" ||
                props.settingDrive === "sftp" ||
                props.settingDrive === "mega" ||
                props.settingDrive === "s3compatible") && (
                <div
                  className="voice-add-confirm"
                  style={{ marginRight: "10px" }}
                  onClick={async () => {
                    if (props.settingDrive === "webdav") {
                      if (!(await checkCorsForDrive())) {
                        return;
                      }
                    }
                    testConnection(props.settingDrive, state.driveConfig);
                  }}
                >
                  <Trans>Test</Trans>
                </div>
              )}
              {(props.settingDrive === "webdav" ||
                props.settingDrive === "ftp" ||
                props.settingDrive === "s3compatible" ||
                props.settingDrive === "sftp") &&
                ConfigService.getReaderConfig("lang") &&
                ConfigService.getReaderConfig("lang").startsWith("zh") && (
                  <div
                    className="voice-add-cancel"
                    style={{ borderWidth: 0, lineHeight: "30px" }}
                    onClick={() => {
                      openExternalUrl(
                        getWebsiteUrl() + getWebsiteLang() + "/add-source"
                      );
                    }}
                  >
                    {props.t("How to fill out")}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
      <div className="setting-dialog-new-title">
        <Trans>Set default sync option</Trans>
        <select
          name=""
          className="lang-setting-dropdown"
          value={props.defaultSyncOption}
          onChange={async (event) => {
            event.preventDefault();
            const newValue = event.target.value;
            if (newValue === "add") {
              setState((prevState) => ({
                ...prevState,
                showDefaultSyncAddGrid: !prevState.showDefaultSyncAddGrid,
              }));
              event.target.value = props.defaultSyncOption;
              return;
            }
            const currentValue = props.defaultSyncOption;
            let onlineBooks: Book[] = [];
            for (let i = 0; i < props.books.length; i++) {
              if (!(await BookUtil.isBookOffline(props.books[i].key))) {
                onlineBooks.push(props.books[i]);
              }
            }
            if (
              onlineBooks.length > 0 &&
              props.defaultSyncOption &&
              newValue !== props.defaultSyncOption
            ) {
              let result = await vexComfirmAsync(
                "Some of your books are currently not downloaded to the local. Changing the default sync option may lead to data loss. We recommend downloading all books to the local by turn on Auto download cloud books in the setting before changing the default sync option. Click 'OK' to proceed without downloading."
              );
              if (result) {
                handleSetDefaultSyncOption(newValue);
              } else {
                event.target.value = currentValue;
              }
            } else {
              handleSetDefaultSyncOption(newValue);
            }
          }}
        >
          {[
            {
              label: "Please select",
              value: "",
              isPro: false,
              support: ["desktop", "browser", "phone"],
            },
            ...driveList,
            {
              label: "Add data source",
              value: "add",
              isPro: false,
              support: ["desktop", "browser", "phone"],
            },
          ]
            .filter(
              (item) =>
                item.value === "add" ||
                item.value === "" ||
                props.dataSourceList.includes(item.value)
            )
            .filter((item) => {
              if (item.value === "add" || item.value === "") {
                return true;
              }
              if (!isElectron) {
                return item.support.includes("browser");
              }
              return true;
            })
            .filter((item) => {
              if (
                isElectron &&
                window.electronAPI?.runtime?.platform !== "darwin" &&
                item.value === "icloud"
              ) {
                return false;
              }
              return true;
            })
            .map((item) => (
              <option
                value={item.value}
                key={item.value}
                className="lang-setting-option"
              >
                {props.t(item.label) + (item.isPro ? " (Pro)" : "")}
              </option>
            ))}
        </select>
      </div>
      <div className="setting-dialog-new-title">
        <Trans>Delete data source</Trans>
        <select
          name=""
          className="lang-setting-dropdown"
          onChange={handleDeleteDataSource}
        >
          {[{ label: "Please select", value: "", isPro: false }, ...driveList]
            .filter(
              (item) =>
                props.dataSourceList.includes(item.value) || item.value === ""
            )
            .map((item) => (
              <option
                value={item.value}
                key={item.value}
                className="lang-setting-option"
              >
                {props.t(item.label) + (item.isPro ? " (Pro)" : "")}
              </option>
            ))}
        </select>
      </div>
      <div className="setting-dialog-new-title">
        <Trans>Backup library</Trans>
        <select
          name=""
          className="lang-setting-dropdown"
          value={state.backupDrive}
          onChange={(event) =>
            handleSelectBackupOrRestoreSource(event, "backup")
          }
        >
          <option value="" className="lang-setting-option">
            {props.t("Please select")}
          </option>
          {[
            { label: "Local", value: "local", isPro: false },
            ...driveList,
            { label: "Add data source", value: "add", isPro: false },
          ]
            .filter(
              (item) =>
                props.dataSourceList.includes(item.value) ||
                item.value === "local" ||
                item.value === "add"
            )
            .map((item) => (
              <option
                value={item.value}
                key={item.value}
                className="lang-setting-option"
              >
                {props.t(item.label) + (item.isPro ? " (Pro)" : "")}
              </option>
            ))}
        </select>
      </div>
      <div className="setting-dialog-new-title">
        <Trans>Restore library</Trans>
        <select
          name=""
          className="lang-setting-dropdown"
          value={state.restoreDrive}
          onChange={(event) =>
            handleSelectBackupOrRestoreSource(event, "restore")
          }
        >
          <option value="" className="lang-setting-option">
            {props.t("Please select")}
          </option>
          {[
            { label: "Local", value: "local", isPro: false },
            ...driveList,
            { label: "Add data source", value: "add", isPro: false },
          ]
            .filter(
              (item) =>
                props.dataSourceList.includes(item.value) ||
                item.value === "local" ||
                item.value === "add"
            )
            .map((item) => (
              <option
                value={item.value}
                key={item.value}
                className="lang-setting-option"
              >
                {props.t(item.label) + (item.isPro ? " (Pro)" : "")}
              </option>
            ))}
        </select>
      </div>

      {props.isAuthed && renderSwitchOption(syncSettingList)}
      {props.isAuthed && (
        <>
          <div className="setting-dialog-new-title">
            <Trans>Scheduled sync interval</Trans>
            <select
              name=""
              className="lang-setting-dropdown"
              value={state.scheduledSyncInterval}
              onChange={(event) => {
                const value = event.target.value;
                ConfigService.setReaderConfig("scheduledSyncInterval", value);
                setPartialState({ scheduledSyncInterval: value });
                toast.success(props.t("Change successful"));
                toast(
                  props.t(
                    "The new sync interval will take effect after restarting Koodo Reader"
                  )
                );
              }}
            >
              <option value="" className="lang-setting-option">
                {props.t("Disabled")}
              </option>
              <option value="1" className="lang-setting-option">
                {i18n.t("Minute duration", {
                  tts: 1,
                })}
              </option>
              <option value="5" className="lang-setting-option">
                {i18n.t("Minute duration", {
                  tts: 5,
                })}
              </option>
              <option value="10" className="lang-setting-option">
                {i18n.t("Minute duration", {
                  tts: 10,
                })}
              </option>
              <option value="15" className="lang-setting-option">
                {i18n.t("Minute duration", {
                  tts: 15,
                })}
              </option>
              <option value="30" className="lang-setting-option">
                {i18n.t("Minute duration", {
                  tts: 30,
                })}
              </option>
              <option value="60" className="lang-setting-option">
                {i18n.t("Hour duration", {
                  tts: 1,
                })}
              </option>
              <option value="120" className="lang-setting-option">
                {i18n.t("Hour duration", {
                  tts: 2,
                })}
              </option>
              <option value="360" className="lang-setting-option">
                {i18n.t("Hour duration", {
                  tts: 6,
                })}
              </option>
              <option value="720" className="lang-setting-option">
                {i18n.t("Hour duration", {
                  tts: 12,
                })}
              </option>
              <option value="1440" className="lang-setting-option">
                {i18n.t("Hour duration", {
                  tts: 24,
                })}
              </option>
            </select>
          </div>
          <p className="setting-option-subtitle">
            <Trans>
              {
                "Automatically sync your library with cloud at the specified interval."
              }
            </Trans>
          </p>
          <div className="setting-dialog-new-title">
            <Trans>Reset sync records</Trans>

            <span
              className="change-location-button"
              onClick={async () => {
                await generateSyncRecord();
                toast.success(props.t("Reset successful"));
              }}
            >
              <Trans>Reset</Trans>
            </span>
          </div>
          <p className="setting-option-subtitle">
            <Trans>
              {
                "Data in other devices is messed up, but the data in this device is normal. You can reset the sync record in this device, delete the KoodoReader/config folder in the data source(Turn off Koodo Sync if necessary), and sync again. This should resolve the issue"
              }
            </Trans>
          </p>
          <div className="setting-dialog-new-plugin">
            <span
              style={{ textDecoration: "underline" }}
              onClick={() => {
                openExternalUrl(
                  getWebsiteUrl() + getWebsiteLang() + "/use-sync"
                );
              }}
            >
              <Trans>How to sync library across devices</Trans>
            </span>
          </div>
        </>
      )}
    </>
  );
};

export default SyncSetting;
