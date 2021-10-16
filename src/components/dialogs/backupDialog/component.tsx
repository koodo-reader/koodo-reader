import React from "react";
import "./backupDialog.css";
import { driveList } from "../../../constants/driveList";
import { backup } from "../../../utils/syncUtils/backupUtil";
import { restore } from "../../../utils/syncUtils/restoreUtil";
import { Trans } from "react-i18next";
import DropboxUtil from "../../../utils/syncUtils/dropbox";
import WebdavUtil from "../../../utils/syncUtils/webdav";
import { BackupDialogProps, BackupDialogState } from "./interface";
import TokenDialog from "../tokenDialog";
import OtherUtil from "../../../utils/otherUtil";
import Lottie from "react-lottie";
import animationSuccess from "../../../assets/lotties/success.json";
import FileSaver from "file-saver";
import toast from "react-hot-toast";
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
      currentDrive: 0,
    };
  }
  handleClose = () => {
    this.props.handleBackupDialog(false);
  };

  handleFinish = () => {
    this.setState({ currentStep: 2 });
    this.props.handleLoadingDialog(false);
    this.showMessage("Excute Successfully");
  };
  handleRestoreToLocal = async (event: any) => {
    event.preventDefault();
    this.props.handleLoadingDialog(true);
    let result = await restore(event.target.files[0]);
    if (result) {
      this.handleFinish();
    }
  };
  showMessage = (message: string) => {
    toast(this.props.t(message));
  };
  handleDrive = (index: number) => {
    let year = new Date().getFullYear(),
      month = new Date().getMonth() + 1,
      day = new Date().getDate();
    this.setState({ currentDrive: index }, async () => {
      switch (index) {
        case 0:
          let blob: Blob | boolean = await backup(
            this.props.books,
            this.props.notes,
            this.props.bookmarks,
            false
          );
          if (!blob) {
            this.showMessage("Backup Failed");
          }
          FileSaver.saveAs(
            blob as Blob,
            `${year}-${month <= 9 ? "0" + month : month}-${
              day <= 9 ? "0" + day : day
            }.zip`
          );
          this.handleFinish();
          break;
        case 1:
          if (!OtherUtil.getReaderConfig("dropbox_token")) {
            this.props.handleTokenDialog(true);
            break;
          }

          if (this.state.isBackup === "yes") {
            this.showMessage("Uploading");
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
            let result = await DropboxUtil.UploadFile(blob);
            if (result) {
              this.handleFinish();
            } else {
              this.showMessage("Upload failed, check your connection");
            }
          } else {
            this.props.handleLoadingDialog(true);
            this.showMessage("Downloading");
            let result = await DropboxUtil.DownloadFile();
            if (result) {
              this.handleFinish();
            } else {
              this.showMessage("Download failed,network problem or no backup");
              this.props.handleLoadingDialog(false);
            }
          }

          break;
        case 2:
          this.showMessage("Coming Soon");
          break;

        case 3:
          if (!OtherUtil.getReaderConfig("webdav_token")) {
            this.props.handleTokenDialog(true);
            break;
          }
          if (this.state.isBackup === "yes") {
            this.showMessage("Uploading");
            this.props.handleLoadingDialog(true);

            let blob: any = await backup(
              this.props.books,
              this.props.notes,
              this.props.bookmarks,
              false
            );
            if (!blob) {
              this.showMessage("Backup Failed");
              this.props.handleLoadingDialog(false);
            }

            let result = await WebdavUtil.UploadFile(
              new File([blob], "data.zip", {
                lastModified: new Date().getTime(),
                type: blob.type,
              })
            );
            if (result) {
              this.handleFinish();
            } else {
              this.showMessage("Upload failed, check your connection");
              this.props.handleLoadingDialog(false);
            }
          } else {
            this.showMessage("Downloading");
            this.props.handleLoadingDialog(true);

            let result = await WebdavUtil.DownloadFile();
            if (!result) {
              this.showMessage("Download failed,network problem or no backup");
            } else {
              this.handleFinish();
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
      return driveList.map((item, index) => {
        return (
          <li
            key={item.id}
            className="backup-page-list-item"
            onClick={() => {
              this.handleDrive(index);
            }}
            style={index !== 2 ? { opacity: 1 } : {}}
          >
            <div className="backup-page-list-item-container">
              <span
                className={`icon-${item.icon} backup-page-list-icon`}
              ></span>
              {OtherUtil.getReaderConfig("dropbox_token") && index === 1 ? (
                <div
                  className="backup-page-list-title"
                  onClick={() => {
                    OtherUtil.setReaderConfig("dropbox_token", "");
                    this.showMessage("Unauthorize Successfully");
                  }}
                  style={{ color: "rgb(0, 120, 212)" }}
                >
                  <Trans>Unauthorize</Trans>
                </div>
              ) : OtherUtil.getReaderConfig("webdav_token") && index === 3 ? (
                <div
                  className="backup-page-list-title"
                  onClick={() => {
                    OtherUtil.setReaderConfig("webdav_token", "");
                    this.showMessage("Unauthorize Successfully");
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
      driveName: driveList[this.state.currentDrive!].icon,
      url: driveList[this.state.currentDrive!].url,
    };

    return (
      <div className="backup-page-container">
        {this.props.isOpenTokenDialog ? <TokenDialog {...dialogProps} /> : null}
        {this.state.currentStep === 0 ? (
          <div className="backup-page-title">
            <Trans>Do you want to backup or restore?</Trans>
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
              <div>
                <Trans>I want to backup</Trans>
              </div>
            </div>

            <div
              className={
                this.state.isBackup === "no"
                  ? "backup-page-backup active"
                  : "backup-page-backup"
              }
              onClick={() => {
                this.setState({ isBackup: "no" });
              }}
            >
              <span className="icon-restore"></span>
              <div>
                <Trans>I want to restore</Trans>
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
                    ? "Backup Successfully"
                    : "Restore Successfully"}
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
            <Trans>Last Step</Trans>
          </div>
        ) : this.state.currentStep === 0 ? (
          <div
            className="backup-page-next"
            onClick={() => {
              this.setState({ currentStep: 1 });
            }}
            style={this.state.isBackup ? {} : { display: "none" }}
          >
            <Trans>Next Step</Trans>
          </div>
        ) : null}
      </div>
    );
  }
}

export default BackupDialog;
