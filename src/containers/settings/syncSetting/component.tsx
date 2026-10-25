import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
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
import { useAppStore } from "../../../store/useAppStore";

export interface SettingInfoState {
  isKeepLocal: boolean;
  isEnableKoodoSync: boolean;
  isDisableAutoSync: boolean;
  autoOffline: boolean;
  hideSyncProgress: boolean;
  driveConfig: any;
  scheduledSyncInterval: string;
  backupDrive: string;
  restoreDrive: string;
  showDefaultSyncAddGrid: boolean;
}

declare var window: any;

const SyncSetting = () => {
  const books = useAppStore((s) => s.manager.books);
  const isAuthed = useAppStore((s) => s.manager.isAuthed);
  const settingDrive = useAppStore((s) => s.manager.settingDrive);
  const dataSourceList = useAppStore((s) => s.backupPage.dataSourceList);
  const defaultSyncOption = useAppStore(
    (s) => s.backupPage.defaultSyncOption
  );
  const cloudSyncFunc = useAppStore((s) => s.book.cloudSyncFunc) as (
    userInfo?: any
  ) => Promise<void>;
  const handleSetting = useAppStore((s) => s.handleSetting);
  const handleFetchBooks = useAppStore((s) => s.handleFetchBooks);
  const handleFetchDataSourceList = useAppStore(
    (s) => s.handleFetchDataSourceList
  );
  const handleFetchDefaultSyncOption = useAppStore(
    (s) => s.handleFetchDefaultSyncOption
  );
  const handleTokenDialog = useAppStore((s) => s.handleTokenDialog);
  const handleSettingMode = useAppStore((s) => s.handleSettingMode);
  const handleSettingDrive = useAppStore((s) => s.handleSettingDrive);
  const handleLoadingDialog = useAppStore((s) => s.handleLoadingDialog);
  const handleFetchUserInfo = useAppStore((s) => s.handleFetchUserInfo);
  const { t } = useTranslation();
  const navigate = useNavigate();
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
    toast.success(t("Change successful"));
  };

  const handleJump = (url: string) => {
    openInBrowser(url);
  };

  const handleToggleSetting = (stateName: string) => {
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
    if (settingDrive) {
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
        t(
          "Koodo Reader's web version are limited by the browser, for more powerful features, please download the desktop version."
        )
      );
      return;
    }
    if (!isAuthed) {
      toast(t("Please upgrade to Pro to use this feature"));
      handleSetting(true);
      handleSettingMode("account");
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
      !isAuthed
    ) {
      toast(t("Please upgrade to Pro to use this feature"));
      handleSetting(true);
      handleSettingMode("account");
      return;
    }
    handleSettingDrive(targetDrive);
    let settingDrive = targetDrive;
    if (settingDrive === "icloud" || settingDrive === "folder") {
      let drivePath = "";
      if (settingDrive === "icloud") {
        drivePath = getICloudDrivePath();
        if (!drivePath) {
          toast.error(
            t(
              "Can't find Koodo Reader's folder in the default iCloud path, please make sure iCloud Drive is installed and set up correctly, and you have already synced your library to iCloud Drive on the iOS version first."
            ),
            {
              duration: 6000,
            }
          );
          handleSettingDrive("");
          return;
        }
      } else if (settingDrive === "folder") {
        const ipcRenderer = window.electronAPI;
        drivePath = await ipcRenderer.invoke("select-path");
        if (!drivePath) {
          toast.error(i18n.t("Please select a folder"));
          handleSettingDrive("");
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
        handleSettingDrive("");
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
        isAuthed &&
        !ConfigService.getItem("defaultSyncOption") &&
        settingDrive !== "microsoft_exp"
      ) {
        ConfigService.setItem("defaultSyncOption", settingDrive);
        if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
          resetKoodoSync();
        }
        handleFetchDefaultSyncOption();
      }
      handleFetchDataSourceList();
      handleSettingDrive("");
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
    handleFetchDataSourceList();
    if (targetDrive === ConfigService.getItem("defaultSyncOption")) {
      ConfigService.removeItem("defaultSyncOption");
      handleFetchDefaultSyncOption();
      if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
        resetKoodoSync();
      }
    }
    toast.success(t("Deletion successful"));
  };

  const handleSetDefaultSyncOption = async (newValue: string) => {
    if (!newValue) {
      return;
    }
    if (!isAuthed) {
      toast(t("Please upgrade to Pro to use this feature"));
      handleSetting(true);
      handleSettingMode("account");
      return;
    }

    ConfigService.setItem("defaultSyncOption", newValue);
    if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
      resetKoodoSync();
    }
    handleFetchDefaultSyncOption();
    toast.success(t("Change successful"));
    if (
      !(await ConfigUtil.isCloudEmpty()) &&
      ConfigService.getReaderConfig("isEnableKoodoSync") === "yes"
    ) {
      toast(
        t(
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
        t(
          "Koodo Reader's web version are limited by the browser, for more powerful features, please download the desktop version."
        )
      );
      return;
    }
    if (
      driveList.find((item) => item.value === targetDrive)?.isPro &&
      !isAuthed
    ) {
      toast(t("Please upgrade to Pro to use this feature"));
      handleSetting(true);
      handleSettingMode("account");
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
        toast.success(t("Execute successful"));
        handleFetchBooks();
        await generateSyncRecord();
      } else {
        toast.dismiss("backup");
        toast.error(t("Backup failed"));
      }
      return;
    }
    if (!(await TokenService.getToken(name + "_token"))) {
      handleTokenDialog(true);
      return;
    }
    toast.dismiss("backup");
    toast(t("Uploading, please wait"), {
      position: "bottom-center",
      id: "backup",
    });
    handleLoadingDialog(true);
    let result = await backup(name);
    if (result === "cancel") {
      handleLoadingDialog(false);
      toast.dismiss("backup");
      return;
    }
    if (result === "success") {
      handleLoadingDialog(false);
      toast.dismiss("backup");
      toast.success(t("Execute successful"));
      handleFetchBooks();
      await generateSyncRecord();
    } else {
      handleLoadingDialog(false);
      toast.dismiss("backup");
      toast.error(t("Upload failed, check your connection"));
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
        toast.success(t("Execute successful"));
        handleFetchBooks();
        await generateSyncRecord();
        setTimeout(() => {
          navigate("/manager/home");
        }, 2000);
      } else {
        toast.dismiss("backup");
        toast.error(t("Download failed,network problem or no backup"));
      }
      return;
    }
    if (!(await TokenService.getToken(name + "_token"))) {
      handleTokenDialog(true);
      return;
    }
    handleLoadingDialog(true);
    toast.dismiss("backup");
    toast(t("Downloading, please wait"));
    let result = await restore(name);
    if (result === "cancel") {
      handleLoadingDialog(false);
      toast.dismiss("backup");
      return;
    }
    if (result === "success") {
      handleLoadingDialog(false);
      toast.dismiss("backup");
      toast.success(t("Execute successful"));
      handleFetchBooks();
      await generateSyncRecord();
      setTimeout(() => {
        navigate("/manager/home");
      }, 2000);
    } else {
      handleLoadingDialog(false);
      toast.dismiss("backup");
      toast.error(t("Download failed,network problem or no backup"));
    }
  };

  const handleCancelDrive = () => {
    handleSettingDrive("");
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
          t(
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
    for (let item of driveInputConfig[settingDrive]) {
      if (!state.driveConfig[item.value] && item.required) {
        toast.error(t("Missing parameters") + ": " + t(item.label));
        flag = false;
        break;
      }
    }
    if (!flag) {
      return;
    }
    if (
      settingDrive === "webdav" ||
      settingDrive === "docker" ||
      settingDrive === "ftp" ||
      settingDrive === "sftp" ||
      settingDrive === "mega" ||
      settingDrive === "s3compatible"
    ) {
      toast.loading(i18n.t("Adding"), { id: "adding-sync-id" });
      let res = await encryptToken(settingDrive, state.driveConfig);
      if (res.code === 200) {
        ConfigService.setListConfig(settingDrive, "dataSourceList");
        toast.success(i18n.t("Binding successful"), { id: "adding-sync-id" });
      } else {
        toast.error(i18n.t("Binding failed"), { id: "adding-sync-id" });
      }
    } else {
      await onSyncCallback(settingDrive, state.driveConfig.token);
    }
    SyncService.removeSyncUtil(settingDrive);
    removeCloudConfig(settingDrive);
    if (isElectron) {
      const ipcRenderer = window.electronAPI;
      await ipcRenderer.invoke("cloud-close", {
        service: settingDrive,
      });
    }
    if (
      isAuthed &&
      !ConfigService.getItem("defaultSyncOption") &&
      settingDrive !== "microsoft_exp"
    ) {
      ConfigService.setItem("defaultSyncOption", settingDrive);
      if (ConfigService.getReaderConfig("isEnableKoodoSync") === "yes") {
        resetKoodoSync();
      }
      handleFetchDefaultSyncOption();
    }
    handleFetchDataSourceList();
    handleSettingDrive("");
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
                  handleToggleSetting(item.propName);
                  let encryptToken = await TokenService.getToken(
                    defaultSyncOption + "_token"
                  );
                  await updateUserConfig({
                    is_enable_koodo_sync:
                      ConfigService.getReaderConfig("isEnableKoodoSync"),
                    default_sync_option: defaultSyncOption,
                    default_sync_token: encryptToken || "",
                  });
                  let userInfo = await handleFetchUserInfo();
                  if (
                    ConfigService.getReaderConfig("isEnableKoodoSync") === "yes"
                  ) {
                    cloudSyncFunc(userInfo);
                  }

                  break;
                case "autoOffline":
                  handleToggleSetting(item.propName);
                  if (!state.autoOffline) {
                    if (defaultSyncOption === "adrive") {
                      toast.error(
                        t(
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

                    toast.success(t("Download completed"), {
                      id: "autoOffline",
                    });

                    setTimeout(() => {
                      toast.dismiss("syncing");
                    }, 3000);
                  }

                  break;
                default:
                  handleToggleSetting(item.propName);
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
            .filter((item) => !dataSourceList.includes(item.value))
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
                  {t(item.label) + (item.isPro ? " (Pro)" : "")}
                </span>
              </div>
            ))}
        </div>
      )}
      {settingDrive && (
        <div
          className="voice-add-new-container"
          style={{
            marginLeft: "25px",
            width: "calc(100% - 50px)",
            fontWeight: 500,
          }}
        >
          {settingDrive === "webdav" ||
          settingDrive === "docker" ||
          settingDrive === "ftp" ||
          settingDrive === "sftp" ||
          settingDrive === "mega" ||
          settingDrive === "s3compatible" ? (
            <>
              {driveInputConfig[settingDrive].map((item) => {
                return (
                  <div key={item.value}>
                    <input
                      type={item.type}
                      name={item.value}
                      key={item.value}
                      placeholder={
                        t(item.label) +
                        (item.required ? "" : " (" + t("Optional") + ")")
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
                        {t(
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
                        {t("Example")}: {item.example}
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
                        {t(item.note)}
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
                placeholder={t(
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
          {settingDrive === "webdav" && !isElectron && (
            <div
              className="token-dialog-tip"
              style={{
                marginTop: "10px",
                fontSize: "13px",
                lineHeight: "16px",
                color: "rgba(231, 69, 69, 0.8)",
              }}
            >
              {t(
                "Only WebDAV service provided by Alist is directly supported in Browser, Other WebDAV services need to enable CORS to work properly. Also due to browser's security restrictions, the WebDAV service must be accessed via HTTPS protocol when you're visiting Koodo Reader via HTTPS protocol."
              )}
            </div>
          )}
          {settingDrive === "docker" && !isElectron && (
            <div
              className="token-dialog-tip"
              style={{
                marginTop: "10px",
                fontSize: "13px",
                lineHeight: "16px",
                color: "rgba(231, 69, 69, 0.8)",
              }}
            >
              {t(
                "The Koodo Reader Docker version does not support the data source feature by default. You need to modify the configuration parameters during deployment to manually enable it. Also due to browser's security restrictions, the Docker service must be accessed via HTTPS protocol when you're visiting Koodo Reader via HTTPS protocol."
              )}
            </div>
          )}
          {settingDrive === "s3compatible" && !isElectron && (
            <div
              className="token-dialog-tip"
              style={{
                marginTop: "10px",
                fontSize: "13px",
                lineHeight: "16px",
                color: "rgba(231, 69, 69, 0.8)",
              }}
            >
              {t(
                "Some S3 services are not compatible with browser environments. If you encounter connection issues, please refer to the service provider's official documentation for instructions on enabling CORS. Also due to browser's security restrictions, the S3 service must be accessed via HTTPS protocol when you're visiting Koodo Reader via HTTPS protocol."
              )}
            </div>
          )}
          <div className="token-dialog-button-container">
            <div
              className="voice-add-confirm"
              onClick={async () => {
                if (settingDrive === "webdav") {
                  if (!(await checkCorsForDrive())) {
                    return;
                  }
                }
                if (
                  settingDrive === "webdav" ||
                  settingDrive === "docker" ||
                  settingDrive === "ftp" ||
                  settingDrive === "sftp" ||
                  settingDrive === "mega" ||
                  settingDrive === "s3compatible"
                ) {
                  let connectionResult = await testConnection(
                    settingDrive,
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
              {(settingDrive === "dropbox" ||
                settingDrive === "dubox" ||
                settingDrive === "yandex" ||
                settingDrive === "yiyiwu" ||
                settingDrive === "google" ||
                settingDrive === "boxnet" ||
                settingDrive === "pcloud" ||
                settingDrive === "adrive" ||
                settingDrive === "microsoft_exp" ||
                settingDrive === "microsoft") && (
                <div
                  className="voice-add-confirm"
                  style={{ marginRight: "10px" }}
                  onClick={async () => {
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
                  }}
                >
                  <Trans>Authorize</Trans>
                </div>
              )}
              {(settingDrive === "webdav" ||
                settingDrive === "docker" ||
                settingDrive === "ftp" ||
                settingDrive === "sftp" ||
                settingDrive === "mega" ||
                settingDrive === "s3compatible") && (
                <div
                  className="voice-add-confirm"
                  style={{ marginRight: "10px" }}
                  onClick={async () => {
                    if (settingDrive === "webdav") {
                      if (!(await checkCorsForDrive())) {
                        return;
                      }
                    }
                    testConnection(settingDrive, state.driveConfig);
                  }}
                >
                  <Trans>Test</Trans>
                </div>
              )}
              {(settingDrive === "webdav" ||
                settingDrive === "ftp" ||
                settingDrive === "s3compatible" ||
                settingDrive === "sftp") &&
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
                    {t("How to fill out")}
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
          value={defaultSyncOption}
          onChange={async (event) => {
            event.preventDefault();
            const newValue = event.target.value;
            if (newValue === "add") {
              setState((prevState) => ({
                ...prevState,
                showDefaultSyncAddGrid: !prevState.showDefaultSyncAddGrid,
              }));
              event.target.value = defaultSyncOption;
              return;
            }
            const currentValue = defaultSyncOption;
            let onlineBooks: Book[] = [];
            for (let i = 0; i < books.length; i++) {
              if (!(await BookUtil.isBookOffline(books[i].key))) {
                onlineBooks.push(books[i]);
              }
            }
            if (
              onlineBooks.length > 0 &&
              defaultSyncOption &&
              newValue !== defaultSyncOption
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
                dataSourceList.includes(item.value)
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
                {t(item.label) + (item.isPro ? " (Pro)" : "")}
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
                dataSourceList.includes(item.value) || item.value === ""
            )
            .map((item) => (
              <option
                value={item.value}
                key={item.value}
                className="lang-setting-option"
              >
                {t(item.label) + (item.isPro ? " (Pro)" : "")}
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
            {t("Please select")}
          </option>
          {[
            { label: "Local", value: "local", isPro: false },
            ...driveList,
            { label: "Add data source", value: "add", isPro: false },
          ]
            .filter(
              (item) =>
                dataSourceList.includes(item.value) ||
                item.value === "local" ||
                item.value === "add"
            )
            .map((item) => (
              <option
                value={item.value}
                key={item.value}
                className="lang-setting-option"
              >
                {t(item.label) + (item.isPro ? " (Pro)" : "")}
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
            {t("Please select")}
          </option>
          {[
            { label: "Local", value: "local", isPro: false },
            ...driveList,
            { label: "Add data source", value: "add", isPro: false },
          ]
            .filter(
              (item) =>
                dataSourceList.includes(item.value) ||
                item.value === "local" ||
                item.value === "add"
            )
            .map((item) => (
              <option
                value={item.value}
                key={item.value}
                className="lang-setting-option"
              >
                {t(item.label) + (item.isPro ? " (Pro)" : "")}
              </option>
            ))}
        </select>
      </div>

      {isAuthed && renderSwitchOption(syncSettingList)}
      {isAuthed && (
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
                toast.success(t("Change successful"));
                toast(
                  t(
                    "The new sync interval will take effect after restarting Koodo Reader"
                  )
                );
              }}
            >
              <option value="" className="lang-setting-option">
                {t("Disabled")}
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
                toast.success(t("Reset successful"));
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
