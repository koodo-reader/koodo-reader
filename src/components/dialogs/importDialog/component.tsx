import React from "react";
import "./importDialog.css";
import { driveList } from "../../../constants/driveList";
import { backup } from "../../../utils/file/backup";
import { restore } from "../../../utils/file/restore";
import { Trans } from "react-i18next";
import { ImportDialogProps, ImportDialogState } from "./interface";
import animationSuccess from "../../../assets/lotties/success.json";
import packageInfo from "../../../../package.json";
import _ from "underscore";
import toast from "react-hot-toast";
import { isElectron } from "react-device-detect";
import { TokenService } from "../../../assets/lib/kookit-extra-browser.min";
import { checkStableUpdate } from "../../../utils/request/common";
import { getCloudConfig, upgradePro } from "../../../utils/file/common";
import SyncService from "../../../utils/storage/syncService";
import { getStorageLocation } from "../../../utils/common";
class ImportDialog extends React.Component<
  ImportDialogProps,
  ImportDialogState
> {
  constructor(props: ImportDialogProps) {
    super(props);
    this.state = {
      isBackup: "",
      currentDrive: "",
      currentPath: "",
      currentFileList: [],
      selectedFileList: [],
      isDeveloperVer: false,
      isFinish: false,
    };
  }
  async componentDidMount() {
    let stableLog = await checkStableUpdate();
    if (packageInfo.version.localeCompare(stableLog.version) > 0) {
      this.setState({ isDeveloperVer: true });
    }
  }
  handleClose = () => {
    this.props.handleImportDialog(false);
  };

  handleFinish = async () => {
    this.setState({ isFinish: true });
    this.props.handleLoadingDialog(false);
    this.showMessage("Execute successful");
    this.props.handleFetchBooks();
    if (this.props.isAuthed) {
      await upgradePro();
    }
    setTimeout(() => {
      this.props.history.push("/manager/home");
    }, 1000);
  };
  showMessage = (message: string) => {
    toast(this.props.t(message));
  };
  handleBackup = async () => {
    let name = this.state.currentDrive;
    if (name === "local") {
      let result = await backup(name);
      if (result) {
        this.handleFinish();
      } else {
        this.showMessage("Backup failed");
      }
      return;
    }

    if (!(await TokenService.getToken(name + "_token")) && name !== "local") {
      this.props.handleTokenDialog(true);
      return;
    }
    this.showMessage("Uploading, please wait");
    this.props.handleLoadingDialog(true);
    let result = await backup(name);
    if (result) {
      this.handleFinish();
    } else {
      this.showMessage("Upload failed, check your connection");
    }
  };
  handleRestore = async () => {
    let name = this.state.currentDrive;
    if (name === "local") {
      let result = await restore(name);
      if (result) {
        this.handleFinish();
      } else {
        this.showMessage("Download failed,network problem or no backup");
        this.props.handleLoadingDialog(false);
      }
      return;
    }

    if (!(await TokenService.getToken(name + "_token"))) {
      this.props.handleTokenDialog(true);
      return;
    }
    this.props.handleLoadingDialog(true);
    this.showMessage("Downloading, please wait");

    let result = await restore(name);
    if (result) {
      this.handleFinish();
    } else {
      this.showMessage("Download failed,network problem or no backup");
      this.props.handleLoadingDialog(false);
    }
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
    console.log(drive, path);
    let fileList = [];
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      let tokenConfig = await getCloudConfig(drive);
      fileList = await ipcRenderer.invoke("picker-list", {
        ...tokenConfig,
        service: drive,
        currentPath: path,
        storagePath: getStorageLocation(),
      });
    } else {
      let pickerUtil = await SyncService.getPickerUtil(drive);
      fileList = await pickerUtil.listFiles(path);
    }
    console.log(fileList);
    this.setState({
      currentFileList: fileList,
    });
  };
  render() {
    return (
      <div className="backup-page-container">
        <div className="edit-dialog-title">
          <Trans>From cloud storage</Trans>
        </div>
        <div className="import-dialog-option">
          {this.state.currentDrive === "" && (
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
                      if (!this.props.dataSourceList.includes(item.value)) {
                        toast(
                          this.props.t(
                            "Please add data source in the setting-Sync and backup first"
                          )
                        );
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
              <div
                key={index}
                className={`cloud-drive-item `}
                onClick={async () => {
                  if (item.indexOf(".") === -1) {
                    this.setState(
                      {
                        currentPath: this.state.currentPath + "/" + item,
                      },
                      async () => {
                        let pickerUtil = await SyncService.getPickerUtil(
                          this.state.currentDrive
                        );
                        let fileList = await pickerUtil.listFiles(
                          this.state.currentPath
                        );
                        this.setState({
                          currentFileList: fileList,
                        });
                      }
                    );
                  } else {
                    let sourcePath = this.state.currentPath + "/" + item;
                    toast.loading(this.props.t("Downloading"), {
                      id: "importing",
                    });
                    let destPath = "temp/" + sourcePath.split("/").pop();
                    let file: any = null;
                    if (isElectron) {
                      const fs = window.require("fs");
                      const path = window.require("path");
                      const dataPath = getStorageLocation() || "";
                      const { ipcRenderer } = window.require("electron");
                      let tokenConfig = await getCloudConfig(
                        this.state.currentDrive
                      );
                      if (!fs.existsSync(path.join(dataPath, "temp"))) {
                        fs.mkdirSync(path.join(dataPath, "temp"), {
                          recursive: true,
                        });
                      }
                      await ipcRenderer.invoke("picker-download", {
                        ...tokenConfig,
                        sourcePath: sourcePath,
                        destPath: destPath,
                        service: this.state.currentDrive,
                        storagePath: dataPath,
                      });
                      console.log("finished download", sourcePath);
                      const buffer = await fs.readFile(
                        path.join(dataPath, destPath)
                      );

                      let arraybuffer = new Uint8Array(buffer).buffer;
                      let blob = new Blob([arraybuffer]);
                      let fileName = path.basename(sourcePath);
                      file = new File([blob], fileName);
                      file.path = sourcePath;
                    } else {
                      let pickerUtil = await SyncService.getPickerUtil(
                        this.state.currentDrive
                      );
                      let arraybuffer = await pickerUtil.remote.downloadFile(
                        sourcePath.substring(1)
                      );
                      console.log(arraybuffer);
                      let blob = new Blob([arraybuffer]);
                      let fileName = sourcePath.split("/").pop() || "file";
                      file = new File([blob], fileName);
                    }
                    toast.dismiss("importing");
                    this.props.importBookFunc(file);
                  }
                }}
              >
                <span className="cloud-drive-label">{item}</span>
                {item.indexOf(".") === -1 && (
                  <span className="icon-dropdown import-dialog-more-file"></span>
                )}
              </div>
            ))}
          {this.state.currentDrive !== "" &&
            this.state.currentFileList.length === 0 && (
              <div className="loading-animation" style={{ marginTop: "-20px" }}>
                <div className="loader"></div>
              </div>
            )}
        </div>
        <div className="import-dialog-back-button">
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
