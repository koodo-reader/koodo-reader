import React from "react";
import "./backupDialog.css";
import { driveList } from "../../../constants/driveList";
import { backup } from "../../../utils/syncUtils/backupUtil";
import { restore } from "../../../utils/syncUtils/restoreUtil";
import { Trans } from "react-i18next";
import DropboxUtil from "../../../utils/syncUtils/dropbox";
import OneDriveUtil from "../../../utils/syncUtils/onedrive";
import GoogleDriveUtil from "../../../utils/syncUtils/googledrive";
import WebdavUtil from "../../../utils/syncUtils/webdav";
import FtpUtil from "../../../utils/syncUtils/ftp";
import SFtpUtil from "../../../utils/syncUtils/sftp";
import S3Util from "../../../utils/syncUtils/s3compatible";
import { BackupDialogProps, BackupDialogState } from "./interface";
import TokenDialog from "../tokenDialog";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import Lottie from "react-lottie";
import animationSuccess from "../../../assets/lotties/success.json";
import packageInfo from "../../../../package.json";

import toast from "react-hot-toast";
import { isElectron } from "react-device-detect";
import { checkStableUpdate } from "../../../utils/commonUtil";
declare var window: any;
const successOptions = {
  loop: false,
  autoplay: true,
  animationData: animationSuccess,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};
class BackupDialog extends React.Component<
  BackupDialogProps,
  BackupDialogState
> {
  constructor(props: BackupDialogProps) {
    super(props);
    this.state = {
      currentStep: 0,
      isBackup: "",
      currentDrive: "local",
      isDeveloperVer: false,
    };
  }
  async componentDidMount() {
    let stableLog = await checkStableUpdate();
    if (packageInfo.version.localeCompare(stableLog.version) > 0) {
      this.setState({ isDeveloperVer: true });
    }
  }
  handleClose = () => {
    this.props.handleBackupDialog(false);
  };

  handleFinish = () => {
    this.setState({ currentStep: 2 });
    this.props.handleLoadingDialog(false);
    this.showMessage("Execute successful");
    this.props.handleFetchBooks();
  };
  handleRestoreToLocal = async (event: any) => {
    event.preventDefault();
    this.props.handleLoadingDialog(true);
    //Fix animation issue
    setTimeout(async () => {
      let result = await restore(event.target.files[0]);
      if (result) {
        this.handleFinish();
      }
    }, 10);
  };
  showMessage = (message: string) => {
    toast(this.props.t(message));
  };
  handleDrive = (name: string) => {
    let year = new Date().getFullYear(),
      month = new Date().getMonth() + 1,
      day = new Date().getDate();
    this.setState({ currentDrive: name }, async () => {
      switch (name) {
        case "local":
          let blob: Blob | boolean = await backup(
            this.props.books,
            this.props.notes,
            this.props.bookmarks,
            false
          );
          if (!blob) {
            this.showMessage("Backup Failed");
          }
          window.saveAs(
            blob as Blob,
            `${year}-${month <= 9 ? "0" + month : month}-${
              day <= 9 ? "0" + day : day
            }.zip`
          );
          this.handleFinish();
          break;
        case "dropbox":
        case "webdav":
        case "onedrive":
        case "googledrive":
        case "ftp":
        case "sftp":
        case "s3compatible":
          if (name === "onedrive" || name === "googledrive") {
            if (!this.state.isDeveloperVer) {
              this.showMessage(
                "This feature is only available in the developer version"
              );
              return;
            }
          }
          if (!StorageUtil.getReaderConfig(name + "_token")) {
            this.props.handleTokenDialog(true);
            break;
          }
          let DriveUtil =
            name === "dropbox"
              ? DropboxUtil
              : name === "ftp"
              ? FtpUtil
              : name === "onedrive"
              ? OneDriveUtil
              : name === "googledrive"
              ? GoogleDriveUtil
              : name === "sftp"
              ? SFtpUtil
              : name === "s3compatible"
              ? S3Util
              : WebdavUtil;
          if (this.state.isBackup === "yes") {
            this.showMessage("Uploading, please wait");
            this.props.handleLoadingDialog(true);

            let blob: Blob | boolean = await backup(
              this.props.books,
              this.props.notes,
              this.props.bookmarks,
              false
            );
            if (!blob) {
              this.showMessage("Backup Failed");
              this.props.handleLoadingDialog(false);
            }

            let result = await DriveUtil.UploadFile(blob);
            if (result) {
              this.handleFinish();
            } else {
              this.showMessage("Upload failed, check your connection");
            }
          } else {
            this.props.handleLoadingDialog(true);
            this.showMessage("Downloading, please wait");
            let result = await DriveUtil.DownloadFile();
            if (result) {
              this.handleFinish();
            } else {
              this.showMessage("Download failed,network problem or no backup");
              this.props.handleLoadingDialog(false);
            }
          }

          break;
        default:
          break;
      }
    });
  };
  render() {
    const renderDrivePage = () => {
      return driveList.map((item) => {
        return (
          <li
            key={item.id}
            className="backup-page-list-item"
            onClick={() => {
              //webdav is avavilible on desktop
              if (
                (item.icon === "webdav" ||
                  item.icon === "ftp" ||
                  item.icon === "s3compatible" ||
                  item.icon === "sftp") &&
                !isElectron
              ) {
                toast(
                  this.props.t(
                    "Koodo Reader's web version are limited by the browser, for more powerful features, please download the desktop version."
                  )
                );
                return;
              }
              this.handleDrive(item.icon);
            }}
          >
            <div className="backup-page-list-item-container">
              <span
                className={`icon-${item.icon} backup-page-list-icon`}
              ></span>
              {StorageUtil.getReaderConfig(item.icon + "_token") ? (
                <div
                  className="backup-page-list-title"
                  onClick={() => {
                    StorageUtil.setReaderConfig(item.icon + "_token", "");
                    this.showMessage("Unauthorize successful");
                  }}
                  style={{ color: "rgb(0, 120, 212)" }}
                >
                  <Trans>Unauthorize</Trans>
                </div>
              ) : (
                <div className="backup-page-list-title">
                  <Trans>{item.name}</Trans>
                </div>
              )}
            </div>
          </li>
        );
      });
    };

    const dialogProps = {
      driveName: this.state.currentDrive,
      url: driveList[
        window._.findLastIndex(driveList, {
          icon: this.state.currentDrive,
        })
      ].url,
      title:
        driveList[
          window._.findLastIndex(driveList, {
            icon: this.state.currentDrive,
          })
        ].name,
    };

    return (
      <div className="backup-page-container">
        {this.state.currentStep === 0 && this.state.isBackup === "no" && (
          <div className="restore-warning">
            <Trans>
              This process is inreversible, and will completely overwrite your
              current library, make sure you know what you're doing before
              proceeding
            </Trans>
          </div>
        )}
        {this.props.isOpenTokenDialog ? <TokenDialog {...dialogProps} /> : null}

        {this.state.currentStep === 0 ? (
          <div className="backup-page-title">
            <Trans>Choose your operation</Trans>
          </div>
        ) : this.state.currentStep === 1 && this.state.isBackup === "yes" ? (
          <div className="backup-page-title">
            <Trans>Where to keep your data?</Trans>
          </div>
        ) : this.state.currentStep === 1 && this.state.isBackup === "no" ? (
          <div className="backup-page-title">
            <Trans>Where is your data?</Trans>
          </div>
        ) : null}
        {this.state.currentStep === 0 ? (
          <div className="backup-page-option">
            <div
              className={
                this.state.isBackup === "yes"
                  ? "backup-page-backup active"
                  : "backup-page-backup"
              }
              onClick={() => {
                this.setState({ isBackup: "yes" });
              }}
            >
              <span className="icon-backup"></span>
              <div style={{ lineHeight: 1.0 }}>
                <Trans>Backup</Trans>
              </div>
            </div>

            <div
              className={
                this.state.isBackup === "no"
                  ? "backup-page-backup active"
                  : "backup-page-backup"
              }
              onClick={(event) => {
                if (!isElectron) {
                  event.preventDefault();
                  toast(
                    this.props.t(
                      "Koodo Reader's web version are limited by the browser, for more powerful features, please download the desktop version."
                    )
                  );
                  return;
                }
                this.setState({ isBackup: "no" });
              }}
            >
              <span className="icon-restore"></span>
              <div style={{ lineHeight: 1.0 }}>
                <Trans>Restore</Trans>
              </div>
            </div>
          </div>
        ) : this.state.currentStep === 1 ? (
          <div className="backup-page-drive-container">
            <div>{renderDrivePage()}</div>
            {this.state.isBackup === "no" ? (
              <input
                type="file"
                id="restore-file"
                accept="application/zip"
                className="restore-file"
                name="file"
                multiple={false}
                onChange={(event) => {
                  this.handleRestoreToLocal(event);
                }}
              />
            ) : null}
          </div>
        ) : (
          <div className="backup-page-finish-container">
            <div className="backup-page-finish">
              <Lottie options={successOptions} height={80} width={80} />
              <div className="backup-page-finish-text">
                <Trans>
                  {this.state.isBackup === "yes"
                    ? "Backup successful"
                    : "Restore successful"}
                </Trans>
              </div>
              {this.state.isBackup ? null : (
                <div style={{ opacity: 0.6 }}>
                  <Trans>Try refresh or restart</Trans>
                </div>
              )}
            </div>
          </div>
        )}
        {this.state.isBackup === "yes" && this.state.currentStep === 0 ? (
          <div className="backup-page-backup-selector"></div>
        ) : null}
        {this.state.isBackup === "no" && this.state.currentStep === 0 ? (
          <div
            className="backup-page-backup-selector"
            style={{ marginLeft: "252px" }}
          ></div>
        ) : null}
        <div
          className="backup-page-close-icon"
          onClick={() => {
            this.handleClose();
          }}
        >
          <span className="icon-close backup-close-icon"></span>
        </div>

        {this.state.currentStep === 1 ? (
          <div
            className="backup-page-next"
            onClick={() => {
              this.setState({ currentStep: 0 });
            }}
          >
            <Trans>Last step</Trans>
          </div>
        ) : this.state.currentStep === 0 ? (
          <div
            className="backup-page-next"
            onClick={() => {
              this.setState({ currentStep: 1 });
            }}
            style={this.state.isBackup ? {} : { display: "none" }}
          >
            <Trans>Next step</Trans>
          </div>
        ) : null}
      </div>
    );
  }
}

export default BackupDialog;
