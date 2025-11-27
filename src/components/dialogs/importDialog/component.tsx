import React from "react";
import "./importDialog.css";
import { driveList } from "../../../constants/driveList";
import { Trans } from "react-i18next";
import { ImportDialogProps, ImportDialogState } from "./interface";
import _ from "underscore";
import toast from "react-hot-toast";
import { isElectron } from "react-device-detect";
import { getCloudConfig } from "../../../utils/file/common";
import SyncService from "../../../utils/storage/syncService";
import {
  getServerRegion,
  getStorageLocation,
  openInBrowser,
  showDownloadProgress,
  supportedFormats,
} from "../../../utils/common";
import {
  ConfigService,
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
class ImportDialog extends React.Component<
  ImportDialogProps,
  ImportDialogState
> {
  googlePickerUtil: any;
  constructor(props: ImportDialogProps) {
    super(props);
    this.state = {
      isBackup: "",
      currentDrive: "",
      currentPath: "",
      currentFileList: [],
      selectedFileList: [],
      isWaitList: false,
    };
  }
  handleClose = () => {
    this.props.handleImportDialog(false);
  };

  showMessage = (message: string) => {
    toast(this.props.t(message));
  };
  handleSelectSource = (event: any) => {
    if (!this.props.dataSourceList.includes(event.target.value)) {
      toast(
        this.props.t(
          "Please add data source in the setting-Sync and backup first"
        )
      );
      return;
    }
    if (
      driveList.find((item) => item.value === event.target.value)?.isPro &&
      !this.props.isAuthed
    ) {
      toast(this.props.t("This feature is not available in the free version"));
      return;
    }
    if (event.target.value === "add") {
      toast(this.props.t("Please add data source in the setting"));
      return;
    }
    this.setState({ currentDrive: event.target.value });
  };
  listFolder = async (drive: string, path: string) => {
    this.setState({ isWaitList: true });
    let fileInfoList = [];
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
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
    this.setState({
      currentFileList: fileInfoList,
      isWaitList: false,
    });
  };
  handleClickItem = async (item: FileInfo) => {
    if (item.type === "folder") {
      this.setState(
        {
          currentPath: this.state.currentPath + "/" + item.name,
        },
        async () => {
          this.listFolder(this.state.currentDrive, this.state.currentPath);
        }
      );
    } else {
      let sourcePath = this.state.currentPath + "/" + item.name;
      item.path = sourcePath; // Add path to item for reference
      this.handleImportBook(item);
    }
  };
  handleImportBook = async (item: FileInfo) => {
    let isSupported = supportedFormats.includes(
      "." + item.name.split(".").pop()?.toLowerCase() || ""
    );
    if (!isSupported) {
      toast.error(
        this.props.t("Unsupported file format") +
          ": " +
          item.name.split(".").pop()
      );
      return;
    }
    toast.loading(this.props.t("Downloading"), {
      id: "offline-book",
    });
    let destPath = "temp/" + item.path.split("/").pop();
    let file: any = null;
    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const dataPath = getStorageLocation() || "";
      const { ipcRenderer } = window.require("electron");
      let tokenConfig = await getCloudConfig(this.state.currentDrive);
      if (!fs.existsSync(path.join(dataPath, "temp"))) {
        fs.mkdirSync(path.join(dataPath, "temp"), {
          recursive: true,
        });
      }
      let timer = showDownloadProgress(
        this.state.currentDrive,
        "picker",
        item.size
      );
      await ipcRenderer.invoke("picker-download", {
        ...tokenConfig,
        baseFolder: "",
        sourcePath: item.path.substring(1),
        destPath: destPath,
        service: this.state.currentDrive,
        storagePath: dataPath,
      });
      clearInterval(timer);
      toast.dismiss("offline-book");
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
        this.state.currentDrive,
        "picker",
        item.size
      );
      let pickerUtil = await SyncService.getPickerUtil(this.state.currentDrive);

      let arraybuffer = await pickerUtil.remote.downloadFile(
        item.path.substring(1)
      );
      clearInterval(timer);
      toast.dismiss("offline-book");
      let blob = new Blob([arraybuffer]);
      let fileName = item.path.split("/").pop() || "file";
      file = new File([blob], fileName);
    }
    toast.dismiss("importing");
    await this.props.importBookFunc(file);
  };
  listAllFilesRecursively = async (folderName: string) => {
    toast.loading(this.props.t("Scanning folder"), {
      id: "scanning",
    });

    try {
      const allFiles = await this.getAllFilesInFolder(
        this.state.currentPath + "/" + folderName
      );

      // Filter only files (not folders) and get full paths
      const fileInfoList = allFiles.filter((file) => file.type === "file");

      if (fileInfoList.length === 0) {
        toast.dismiss("scanning");
        toast(this.props.t("No files found in this folder"));
        return;
      }
      let selectedFileList = fileInfoList.filter((file) =>
        supportedFormats.includes(
          "." + file.name.split(".").pop()?.toLowerCase() || ""
        )
      );
      toast.dismiss("scanning");
      toast.success(this.props.t("Successfully scanned folder"));
      for (let i = 0; i < selectedFileList.length; i++) {
        let fileInfo = selectedFileList[i];

        await this.handleImportBook(fileInfo);
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

  getAllFilesInFolder = async (folderPath: string): Promise<FileInfo[]> => {
    let allFiles: FileInfo[] = [];

    try {
      let fileInfoList: FileInfo[] = [];

      if (isElectron) {
        const { ipcRenderer } = window.require("electron");
        let tokenConfig = await getCloudConfig(this.state.currentDrive);
        fileInfoList = await ipcRenderer.invoke("picker-list", {
          ...tokenConfig,
          baseFolder: "",
          service: this.state.currentDrive,
          currentPath: folderPath,
          storagePath: getStorageLocation(),
        });
      } else {
        let pickerUtil = await SyncService.getPickerUtil(
          this.state.currentDrive
        );
        fileInfoList = await pickerUtil.listFileInfos(folderPath);
      }

      for (const item of fileInfoList) {
        const fullPath = folderPath + "/" + item.name;
        item.path = fullPath; // Add path to item for reference

        if (item.type === "folder") {
          // It's a folder, recursively get files from it
          const subFiles = await this.getAllFilesInFolder(fullPath);
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
  handleGooglePicker = async () => {
    try {
      let pickerUtil: any = await SyncService.getPickerUtil("google");
      await pickerUtil.remote.refreshToken();
      this.googlePickerUtil = new GooglePickerUtil({
        accessToken: pickerUtil.remote.config.access_token,
        apiKey: "",
        appId: "1051055003225",
      });

      if (isElectron) {
        const { ipcRenderer } = window.require("electron");
        ipcRenderer.invoke("google-picker", {
          url:
            "https://dl.koodoreader.com/websites/google-picker.html?access_token=" +
            pickerUtil.remote.config.access_token,
        });
        ipcRenderer.once("picker-finished", async (event: any, config: any) => {
          if (config && config.action === "picked" && config.docs) {
            for (const file of config.docs) {
              await this.handleImportGoogleFile(file);
            }
          }
        });
      } else {
        await this.googlePickerUtil.createPicker(this.handlePickerCallback);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      console.error("Error creating Google Picker:", error);
      toast.error(this.props.t("Failed to open Google Picker"));
    }
  };

  // Google Picker回调处理
  handlePickerCallback = async (data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const files = data.docs;

      for (const file of files) {
        await this.handleImportGoogleFile(file);
      }
    }
  };

  // 处理Google文件导入
  handleImportGoogleFile = async (googleFile: any) => {
    try {
      // 检查文件格式
      const fileExtension =
        "." + googleFile.name.split(".").pop()?.toLowerCase();
      if (!supportedFormats.includes(fileExtension)) {
        toast.error(
          this.props.t("Unsupported file format") + ": " + fileExtension
        );
        return;
      }

      toast.loading(this.props.t("Downloading") + ": " + googleFile.name, {
        id: "google-download-" + googleFile.id,
      });

      // 下载文件
      const arrayBuffer = await this.googlePickerUtil.downloadFile(
        googleFile.id
      );
      const blob = new Blob([arrayBuffer]);
      const file = new File([blob], googleFile.name);

      toast.dismiss("google-download-" + googleFile.id);
      await this.props.importBookFunc(file);
    } catch (error) {
      toast.error(
        "Error importing Google file: " +
          (error instanceof Error ? error.message : String(error)),
        {
          id: "google-download-" + googleFile.id,
        }
      );
      console.error("Error importing Google file:", error);
      toast.error(this.props.t("Failed to import") + ": " + googleFile.name);
    }
  };
  render() {
    return (
      <div
        className="backup-page-container"
        style={{ height: "450px", top: "calc(50% - 225px)" }}
      >
        <div className="edit-dialog-title">
          <Trans>From cloud storage</Trans>
        </div>
        <div className="import-dialog-option">
          {this.state.currentDrive === "" && (
            <>
              {driveList
                .filter((item) => {
                  if (getServerRegion() === "china") {
                    return item.isCNAvailable;
                  }
                  return true;
                })
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
                      if (!this.props.isAuthed) {
                        toast(
                          this.props.t(
                            "This feature is not available in the free version"
                          )
                        );
                        return;
                      }

                      if (!this.props.dataSourceList.includes(item.value)) {
                        this.props.handleSetting(true);
                        this.props.handleSettingMode("sync");
                        this.props.handleSettingDrive(item.value);
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
                                  settingDrive === "adrive")
                                ? KookitConfig.ThirdpartyConfig.cnCallbackUrl
                                : KookitConfig.ThirdpartyConfig.callbackUrl
                            )
                          );
                        }
                        return;
                      }
                      if (item.value === "google") {
                        this.handleGooglePicker();
                        return;
                      }
                      this.setState({
                        currentDrive: item.value,
                        currentPath: "",
                      });

                      this.listFolder(item.value, "");
                    }}
                  >
                    <span className="cloud-drive-label">
                      {this.props.t(item.label)}
                    </span>
                    <span className="icon-dropdown import-dialog-more-file"></span>
                  </div>
                ))}
            </>
          )}
          {this.state.currentDrive !== "" &&
            this.state.currentFileList.length > 0 &&
            this.state.currentFileList.map((item, index) => (
              <div key={index} className={`cloud-drive-item `}>
                <span
                  className="cloud-drive-label"
                  onClick={async () => {
                    this.handleClickItem(item);
                  }}
                >
                  {item.name}
                </span>
                {item.size > 0 && item.type === "file" && (
                  <span
                    className="cloud-drive-label"
                    style={{ maxWidth: "80px" }}
                  >
                    {(item.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                )}

                {item.type === "folder" && (
                  <span
                    className="import-dialog-folder-button"
                    onClick={() => {
                      //list all files in the folder and its subfolder
                      this.listAllFilesRecursively(item.name);
                    }}
                  >
                    <span
                      data-tooltip-id="my-tooltip"
                      data-tooltip-content={this.props.t("Import folder")}
                    >
                      <span className="icon-import import-dialog-folder-icon"></span>
                    </span>
                  </span>
                )}
                {item.type === "folder" ? (
                  <span
                    className="icon-dropdown import-dialog-more-file"
                    onClick={async () => {
                      this.handleClickItem(item);
                    }}
                  ></span>
                ) : this.state.selectedFileList
                    .map((item) => item.path)
                    .includes(this.state.currentPath + "/" + item.name) ? (
                  <span
                    className="icon-check import-dialog-check-file"
                    style={{ fontWeight: "bold" }}
                    onClick={() => {
                      this.setState({
                        selectedFileList: this.state.selectedFileList.filter(
                          (file) =>
                            file.path !==
                            this.state.currentPath + "/" + item.name
                        ),
                      });
                    }}
                  ></span>
                ) : (
                  <span
                    className="icon-add import-dialog-more-file"
                    onClick={() => {
                      this.setState({
                        selectedFileList: [
                          ...this.state.selectedFileList,
                          {
                            ...item,
                            path: this.state.currentPath + "/" + item.name,
                          },
                        ],
                      });
                    }}
                  ></span>
                )}
              </div>
            ))}
          {this.state.currentDrive !== "" &&
            this.state.currentFileList.length === 0 &&
            this.state.isWaitList && (
              <div className="loading-animation" style={{ height: "100%" }}>
                <div className="loader"></div>
              </div>
            )}
          {this.state.currentDrive !== "" &&
            this.state.currentFileList.length === 0 &&
            !this.state.isWaitList && (
              <div className="loading-animation" style={{ height: "100%" }}>
                {this.props.t("Empty")}
              </div>
            )}
        </div>
        <div
          className="import-dialog-back-button"
          style={{ left: "20px", color: "rgb(231, 69, 69)" }}
          onClick={async () => {
            if (this.state.selectedFileList.length === 0) {
              toast.error(this.props.t("No file selected"));
              return;
            }
            for (let i = 0; i < this.state.selectedFileList.length; i++) {
              let fileInfo = this.state.selectedFileList[i];

              await this.handleImportBook(fileInfo);
            }
            this.setState({
              selectedFileList: [],
            });
          }}
        >
          {this.props.t("Import") +
            " (" +
            this.state.selectedFileList.length +
            ")"}
        </div>
        <div
          className="import-dialog-back-button"
          onClick={async () => {
            if (this.state.currentPath === "") {
              this.setState({ currentDrive: "", currentFileList: [] });
              return;
            }
            let parentPath = this.state.currentPath
              .split("/")
              .slice(0, -1)
              .join("/");
            this.setState({ currentPath: parentPath });
            this.listFolder(this.state.currentDrive, parentPath);
          }}
        >
          {this.props.t("Back to parent")}
        </div>

        <div
          className="backup-page-close-icon"
          onClick={() => {
            this.handleClose();
          }}
        >
          <span className="icon-close backup-close-icon"></span>
        </div>
      </div>
    );
  }
}

export default ImportDialog;
