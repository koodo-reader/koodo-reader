//备份和恢复页面
import React from "react";
import "./backupPage.css";
import { driveList } from "../../utils/readerConfig";
import BackupUtil from "../../utils/backupUtil";
import RestoreUtil from "../../utils/restoreUtil";
import { Trans } from "react-i18next";
import DropboxUtil from "../../utils/syncUtils/dropbox";
import { BackupPageProps, BackupPageState } from "./interface";
import TokenDialog from "../../components/tokenDialog";
class BackupPage extends React.Component<BackupPageProps, BackupPageState> {
  constructor(props: BackupPageProps) {
    super(props);
    this.state = {
      currentStep: 0,
      isBackup: null,
      currentDrive: 0,
    };
  }
  handleClose = () => {
    this.props.handleBackupDialog(false);
  };

  handleFinish = () => {
    this.setState({ currentStep: 2 });
  };
  handleRestoreToLocal = (event: any) => {
    event.preventDefault();
    RestoreUtil.restore(event.target.files[0], this.handleFinish);
  };
  showMessage = (message: string) => {
    this.props.handleMessage(message);
    this.props.handleMessageBox(true);
  };
  handleDrive = (index: number) => {
    this.setState({ currentDrive: index }, () => {
      switch (index) {
        case 0:
          BackupUtil.backup(
            this.props.books,
            this.props.notes,
            this.props.digests,
            this.props.highlighters,
            this.props.bookmarks,
            this.handleFinish,
            0,
            this.showMessage
          );
          break;
        case 1:
          if (!localStorage.getItem("dropbox_access_token")) {
            this.props.handleTokenDialog(true);
            break;
          }
          if (this.state.isBackup) {
            this.showMessage("Uploading");
            BackupUtil.backup(
              this.props.books,
              this.props.notes,
              this.props.digests,
              this.props.highlighters,
              this.props.bookmarks,
              this.handleFinish,
              1,
              this.showMessage
            );
          } else {
            this.showMessage("Downloading");
            DropboxUtil.DownloadFile(this.handleFinish, this.showMessage);
          }

          break;
        case 2:
          this.showMessage("Coming Soon");
          break;
        case 3:
          this.showMessage("Coming Soon");
          break;
        case 4:
          this.showMessage("Coming Soon");
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
            style={index === 0 || index === 1 ? { opacity: 1 } : {}}
          >
            <div className="backup-page-list-item-container">
              <span
                className={`icon-${item.icon} backup-page-list-icon`}
              ></span>
              <div className="backup-page-list-title">
                <Trans>{item.name}</Trans>
              </div>
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
        ) : this.state.currentStep === 1 && this.state.isBackup ? (
          <div className="backup-page-title">
            <Trans>Where to keep your data?</Trans>
          </div>
        ) : this.state.currentStep === 1 && !this.state.isBackup ? (
          <div className="backup-page-title">
            <Trans>Where is your data?</Trans>
          </div>
        ) : null}
        {this.state.currentStep === 0 ? (
          <div className="backup-page-option">
            <div
              className={
                this.state.isBackup === true
                  ? "backup-page-backup active"
                  : "backup-page-backup"
              }
              onClick={() => {
                this.setState({ isBackup: true });
              }}
            >
              <span className="icon-backup"></span>
              <div>
                <Trans>I want to backup</Trans>
              </div>
            </div>

            <div
              className={
                this.state.isBackup === false
                  ? "backup-page-backup active"
                  : "backup-page-backup"
              }
              onClick={() => {
                this.setState({ isBackup: false });
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
            {!this.state.isBackup ? (
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
              <span className="icon-message backup-page-finish-icon"></span>
              <div className="backup-page-finish-text">
                <Trans>
                  {this.state.isBackup
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
        {this.state.isBackup && this.state.currentStep === 0 ? (
          <div className="backup-page-backup-selector"></div>
        ) : null}
        {this.state.isBackup === false && this.state.currentStep === 0 ? (
          <div
            className="backup-page-backup-selector"
            style={{ marginLeft: "252px" }}
          ></div>
        ) : null}
        <span
          className="icon-close backup-page-close-icon"
          onClick={() => {
            this.handleClose();
          }}
        ></span>
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
            style={this.state.isBackup !== null ? {} : { display: "none" }}
          >
            <Trans>Next Step</Trans>
          </div>
        ) : null}
      </div>
    );
  }
}

export default BackupPage;
