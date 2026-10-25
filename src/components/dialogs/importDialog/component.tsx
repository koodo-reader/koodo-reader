import { useLatest } from "../../../utils/hooks/useLatest";
import { useTranslation } from "react-i18next";
import React, { useRef, useState } from "react";
import "./importDialog.css";
import { driveList } from "../../../constants/driveList";
import { Trans } from "react-i18next";
import { ImportDialogState } from "./interface";
import { useAppStore } from "../../../store/useAppStore";
import _ from "underscore";
import toast from "react-hot-toast";
import { isElectron } from "react-device-detect";
import { getCloudConfig } from "../../../utils/file/common";
import SyncService from "../../../utils/storage/syncService";
import {
  getServerRegion,
  getStorageLocation,
  openExternalUrl,
  openInBrowser,
  showDownloadProgress,
  supportedFormats,
} from "../../../utils/common";
import {
  KookitConfig,
  SyncUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import { GooglePickerUtil } from "../../../utils/file/googlePicker";
declare var window: any;
type FileInfo = {
  name: string;
  size: number;
  type: string;
  modified: string;
  path: string;
};

const ImportDialog = () => {
  const isAuthed = useAppStore((s) => s.manager.isAuthed);
  const dataSourceList = useAppStore((s) => s.backupPage.dataSourceList);
  const importBookFunc = useAppStore((s) => s.book.importBookFunc);
  const handleImportDialog = useAppStore((s) => s.handleImportDialog);
  const handleSetting = useAppStore((s) => s.handleSetting);
  const handleSettingMode = useAppStore((s) => s.handleSettingMode);
  const handleSettingDrive = useAppStore((s) => s.handleSettingDrive);
  const { t } = useTranslation();
  const [state, setState] = useState<ImportDialogState>(() => ({
    currentDrive: "",
    currentPath: "",
    currentFileList: [],
    selectedFileList: [],
    isWaitList: false,
  }));
  const googlePickerUtil = useRef<any>(null);
  const stateRef = useLatest(state);

  const handleClose = () => {
    handleImportDialog(false);
  };

  const showMessage = (message: string) => {
    toast(t(message));
  };
  const handleSelectSource = (event: any) => {
    if (!dataSourceList.includes(event.target.value)) {
      toast(
        t("Please add data source in the setting-Sync and backup first")
      );
      handleSetting(true);
      handleSettingMode("sync");
      return;
    }
    if (
      driveList.find((item) => item.value === event.target.value)?.isPro &&
      !isAuthed
    ) {
      toast(t("Please upgrade to Pro to use this feature"));
      handleSetting(true);
      handleSettingMode("account");
      return;
    }
    if (event.target.value === "add") {
      toast(
        t("Please add data source in the setting-Sync and backup first")
      );
      handleSetting(true);
      handleSettingMode("sync");

      return;
    }
    setState((prev) => ({ ...prev, currentDrive: event.target.value }));
  };
  const listFolder = async (drive: string, path: string) => {
    setState((prev) => ({ ...prev, isWaitList: true }));
    let fileInfoList = [];
    if (isElectron) {
      const ipcRenderer = window.electronAPI;
      let tokenConfig = await getCloudConfig(drive);
      fileInfoList = await ipcRenderer.invoke("picker-list", {
        ...tokenConfig,
        baseFolder: "",
        service: drive,
        currentPath: path,
        storagePath: getStorageLocation(),
      });
    } else {
      let pickerUtil = await SyncService.getPickerUtil(drive);
      fileInfoList = await pickerUtil.listFileInfos(path);
    }
    setState((prev) => ({
      ...prev,
      currentFileList: fileInfoList,
      isWaitList: false,
    }));
  };
  const handleClickItem = async (item: FileInfo) => {
    if (item.type === "folder") {
      const nextPath = stateRef.current.currentPath + "/" + item.name;
      setState((prev) => ({
        ...prev,
        currentPath: nextPath,
      }));
      listFolder(stateRef.current.currentDrive, nextPath);
    } else {
      let sourcePath = stateRef.current.currentPath + "/" + item.name;
      item.path = sourcePath; // Add path to item for reference
      handleImportBook(item);
    }
  };
  const handleImportBook = async (item: FileInfo) => {
    let isSupported = supportedFormats.includes(
      "." + item.name.split(".").pop()?.toLowerCase() || ""
    );
    if (!isSupported) {
      toast.error(
        t("Unsupported file format") + ": " + item.name.split(".").pop()
      );
      return;
    }
    toast.loading(t("Downloading"), {
      id: "offline-book-import",
      position: "bottom-center",
    });
    let destPath = "temp/" + item.path.split("/").pop();
    let file: any = null;
    if (isElectron) {
      const fs = window.electronAPI.fs;
      const path = window.electronAPI.path;
      const dataPath = getStorageLocation() || "";
      const ipcRenderer = window.electronAPI;
      let tokenConfig = await getCloudConfig(stateRef.current.currentDrive);
      if (!fs.existsSync(path.join(dataPath, "temp"))) {
        fs.mkdirSync(path.join(dataPath, "temp"), {
          recursive: true,
        });
      }
      let timer = showDownloadProgress(
        stateRef.current.currentDrive,
        "picker",
        item.size,
        "offline-book-import"
      );
      await ipcRenderer.invoke("picker-download", {
        ...tokenConfig,
        baseFolder: "",
        sourcePath: item.path.substring(1),
        destPath: destPath,
        service: stateRef.current.currentDrive,
        storagePath: dataPath,
      });
      clearInterval(timer);
      toast.dismiss("offline-book-import");
      const buffer = fs.readFileSync(path.join(dataPath, destPath));

      let arraybuffer = new Uint8Array(buffer).buffer;
      let blob = new Blob([arraybuffer]);
      let fileName = path.basename(item.path);
      file = new File([blob], fileName);
      file.path = item.path;
      // Clean up the temp file after import
      fs.unlinkSync(path.join(dataPath, destPath));
    } else {
      let timer = showDownloadProgress(
        stateRef.current.currentDrive,
        "picker",
        item.size,
        "offline-book-import"
      );
      let pickerUtil = await SyncService.getPickerUtil(
        stateRef.current.currentDrive
      );

      let arraybuffer = await pickerUtil.remote.downloadFile(
        item.path.substring(1)
      );
      clearInterval(timer);
      toast.dismiss("offline-book-import");
      let blob = new Blob([arraybuffer]);
      let fileName = item.path.split("/").pop() || "file";
      file = new File([blob], fileName);
    }
    toast.dismiss("importing");
    await importBookFunc(file);
  };
  const listAllFilesRecursively = async (folderName: string) => {
    toast.loading(t("Scanning folder"), {
      id: "scanning",
    });

    try {
      const allFiles = await getAllFilesInFolder(
        stateRef.current.currentPath + "/" + folderName
      );

      // Filter only files (not folders) and get full paths
      const fileInfoList = allFiles.filter((file) => file.type === "file");

      if (fileInfoList.length === 0) {
        toast.dismiss("scanning");
        toast(t("No files found in this folder"));
        return;
      }
      let selectedFileList = fileInfoList.filter((file) =>
        supportedFormats.includes(
          "." + file.name.split(".").pop()?.toLowerCase() || ""
        )
      );
      toast.dismiss("scanning");
      toast.success(t("Successfully scanned folder"));
      for (let i = 0; i < selectedFileList.length; i++) {
        let fileInfo = selectedFileList[i];

        await handleImportBook(fileInfo);
      }
    } catch (error) {
      toast.dismiss("scanning");
      toast.error(
        "Error scanning folder" +
          ": " +
          (error instanceof Error ? error.message : String(error))
      );
      console.error("Error scanning folder:", error);
    }
  };

  const getAllFilesInFolder = async (
    folderPath: string
  ): Promise<FileInfo[]> => {
    let allFiles: FileInfo[] = [];

    try {
      let fileInfoList: FileInfo[] = [];

      if (isElectron) {
        const ipcRenderer = window.electronAPI;
        let tokenConfig = await getCloudConfig(stateRef.current.currentDrive);
        fileInfoList = await ipcRenderer.invoke("picker-list", {
          ...tokenConfig,
          baseFolder: "",
          service: stateRef.current.currentDrive,
          currentPath: folderPath,
          storagePath: getStorageLocation(),
        });
      } else {
        let pickerUtil = await SyncService.getPickerUtil(
          stateRef.current.currentDrive
        );
        fileInfoList = await pickerUtil.listFileInfos(folderPath);
      }

      for (const item of fileInfoList) {
        const fullPath = folderPath + "/" + item.name;
        item.path = fullPath; // Add path to item for reference

        if (item.type === "folder") {
          // It's a folder, recursively get files from it
          const subFiles = await getAllFilesInFolder(fullPath);
          allFiles = allFiles.concat(subFiles);
        } else {
          // It's a file, add to list
          allFiles.push(item);
        }
      }
    } catch (error) {
      toast.error(
        "Error listing files in folder: " +
          (error instanceof Error ? error.message : String(error))
      );
      console.error("Error listing files in folder:", error);
    }

    return allFiles;
  };
  // 新增Google Picker处理方法
  const handleGooglePicker = async () => {
    try {
      if (isElectron) {
        toast.loading(
          t("Please select the books in the Google Drive Picker"),
          {
            id: "google-picker",
          }
        );
      }
      let pickerUtil: any = await SyncService.getPickerUtil("google");
      googlePickerUtil.current = new GooglePickerUtil({
        accessToken: pickerUtil.remote.config.access_token,
        apiKey: "",
        appId: "1051055003225",
      });
      toast.dismiss("google-picker");

      if (isElectron) {
        openExternalUrl(
          "https://dl.koodoreader.com/websites/google-picker.html?access_token=" +
            pickerUtil.remote.config.access_token
        );
        const ipcRenderer = window.electronAPI;
        ipcRenderer.once("picker-finished", async (config: any) => {
          if (config && config.action === "picked" && config.docs) {
            for (const file of config.docs) {
              await handleImportGoogleFile(file);
            }
          }
        });
      } else {
        await googlePickerUtil.current.createPicker(handlePickerCallback);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      console.error("Error creating Google Picker:", error);
      toast.error(t("Failed to open Google Picker"));
    }
  };

  // Google Picker回调处理
  const handlePickerCallback = async (data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const files = data.docs;
      for (const file of files) {
        await handleImportGoogleFile(file);
      }
    }
  };

  // 处理Google文件导入
  const handleImportGoogleFile = async (googleFile: any) => {
    try {
      // 检查文件格式
      const fileExtension =
        "." + googleFile.name.split(".").pop()?.toLowerCase();
      if (!supportedFormats.includes(fileExtension)) {
        toast.error(t("Unsupported file format") + ": " + fileExtension);
        return;
      }

      toast.loading(t("Downloading") + ": " + googleFile.name, {
        id: "google-download-" + googleFile.id,
        position: "bottom-center",
      });

      // 下载文件
      const arrayBuffer = await googlePickerUtil.current.downloadFile(
        googleFile.id
      );
      const blob = new Blob([arrayBuffer]);
      const file = new File([blob], googleFile.name);

      toast.dismiss("google-download-" + googleFile.id);

      await importBookFunc(file);
    } catch (error) {
      toast.error(
        "Error importing Google file: " +
          (error instanceof Error ? error.message : String(error)),
        {
          id: "google-download-" + googleFile.id,
        }
      );
      console.error("Error importing Google file:", error);
      toast.error(t("Failed to import") + ": " + googleFile.name);
    }
  };

  return (
    <div
      className="backup-page-container"
      style={{ height: "450px", top: "calc(50% - 225px)" }}
    >
      <div className="backup-dialog-title">
        <Trans>From cloud storage</Trans>
      </div>
      <div className="import-dialog-option">
        {state.currentDrive === "" && (
          <>
            {driveList
              .filter(
                (item) =>
                  !item.scoped &&
                  item.support.includes(isElectron ? "desktop" : "browser")
              )
              .map((item) => (
                <div
                  key={item.value}
                  className={`cloud-drive-item `}
                  onClick={() => {
                    if (item.isPro && !isAuthed) {
                      toast(
                        t("Please upgrade to Pro to use this feature")
                      );
                      handleSetting(true);
                      handleSettingMode("account");
                      return;
                    }

                    if (!dataSourceList.includes(item.value)) {
                      handleSetting(true);
                      handleSettingMode("sync");
                      handleSettingDrive(item.value);
                      let settingDrive = item.value;
                      if (
                        settingDrive === "dropbox" ||
                        settingDrive === "yandex" ||
                        settingDrive === "yiyiwu" ||
                        settingDrive === "dubox" ||
                        settingDrive === "google" ||
                        settingDrive === "boxnet" ||
                        settingDrive === "pcloud" ||
                        settingDrive === "adrive" ||
                        settingDrive === "microsoft_exp" ||
                        settingDrive === "microsoft"
                      ) {
                        openInBrowser(
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
                      return;
                    }
                    if (item.value === "google") {
                      handleGooglePicker();
                      return;
                    }
                    setState((prev) => ({
                      ...prev,
                      currentDrive: item.value,
                      currentPath: "",
                    }));

                    listFolder(item.value, "");
                  }}
                >
                  <span className="cloud-drive-label">
                    {t(item.label) + (item.isPro ? " (Pro)" : "")}
                  </span>
                  <span className="icon-dropdown import-dialog-more-file"></span>
                </div>
              ))}
          </>
        )}
        {state.currentDrive !== "" &&
          state.currentFileList.length > 0 &&
          state.currentFileList.map((item, index) => (
            <div key={index} className={`cloud-drive-item `}>
              <span
                className="cloud-drive-label"
                onClick={async () => {
                  handleClickItem(item);
                }}
              >
                {item.name}
              </span>
              {item.size > 0 && item.type === "file" && (
                <span className="cloud-drive-label" style={{ maxWidth: "80px" }}>
                  {(item.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              )}

              {item.type === "folder" && (
                <span
                  className="import-dialog-folder-button"
                  onClick={() => {
                    //list all files in the folder and its subfolder
                    listAllFilesRecursively(item.name);
                  }}
                >
                  <span
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content={t("Import folder")}
                  >
                    <span className="icon-import import-dialog-folder-icon"></span>
                  </span>
                </span>
              )}
              {item.type === "folder" ? (
                <span
                  className="icon-dropdown import-dialog-more-file"
                  onClick={async () => {
                    handleClickItem(item);
                  }}
                ></span>
              ) : state.selectedFileList
                  .map((item) => item.path)
                  .includes(state.currentPath + "/" + item.name) ? (
                <span
                  className="icon-check import-dialog-check-file"
                  style={{ fontWeight: "bold" }}
                  onClick={() => {
                    setState((prev) => ({
                      ...prev,
                      selectedFileList: prev.selectedFileList.filter(
                        (file) =>
                          file.path !== state.currentPath + "/" + item.name
                      ),
                    }));
                  }}
                ></span>
              ) : (
                <span
                  className="icon-add import-dialog-more-file"
                  onClick={() => {
                    setState((prev) => ({
                      ...prev,
                      selectedFileList: [
                        ...prev.selectedFileList,
                        {
                          ...item,
                          path: state.currentPath + "/" + item.name,
                        },
                      ],
                    }));
                  }}
                ></span>
              )}
            </div>
          ))}
        {state.currentDrive !== "" &&
          state.currentFileList.length === 0 &&
          state.isWaitList && (
            <div className="loading-animation" style={{ height: "100%" }}>
              <div className="loader"></div>
            </div>
          )}
        {state.currentDrive !== "" &&
          state.currentFileList.length === 0 &&
          !state.isWaitList && (
            <div className="loading-animation" style={{ height: "100%" }}>
              {t("Empty")}
            </div>
          )}
      </div>
      <div
        className="import-dialog-back-button"
        style={{ left: "20px", color: "rgb(231, 69, 69)" }}
        onClick={async () => {
          if (state.selectedFileList.length === 0) {
            toast.error(t("No file selected"));
            return;
          }
          for (let i = 0; i < state.selectedFileList.length; i++) {
            let fileInfo = state.selectedFileList[i];

            await handleImportBook(fileInfo);
          }
          setState((prev) => ({
            ...prev,
            selectedFileList: [],
          }));
        }}
      >
        {t("Import") + " (" + state.selectedFileList.length + ")"}
      </div>
      <div
        className="import-dialog-back-button"
        onClick={async () => {
          if (state.currentPath === "") {
            setState((prev) => ({
              ...prev,
              currentDrive: "",
              currentFileList: [],
            }));
            return;
          }
          let parentPath = state.currentPath.split("/").slice(0, -1).join("/");
          setState((prev) => ({ ...prev, currentPath: parentPath }));
          listFolder(state.currentDrive, parentPath);
        }}
      >
        {t("Back to parent")}
      </div>

      <div
        className="backup-page-close-icon"
        onClick={() => {
          handleClose();
        }}
      >
        <span className="icon-close backup-close-icon"></span>
      </div>
    </div>
  );
};

export default ImportDialog;
