//备份和恢复页面
import React from "react";
import "./backupPage.css";
import { driveList } from "../../utils/readerConfig";
import { handleBackupDialog } from "../../redux/actions/backupPage";
import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import BackupUtil from "../../utils/backupUtil";
import RestoreUtil from "../../utils/restoreUtil";
import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import DigestModel from "../../model/Digest";
import HighligherModel from "../../model/Highlighter";
import BookmarkModel from "../../model/Bookmark";
import { stateType } from "../../redux/store";
import { Trans } from "react-i18next";
import { withNamespaces } from "react-i18next";

export interface BackupPageProps {
  handleBackupDialog: (isBackup: boolean) => void;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  books: BookModel[];
  notes: NoteModel[];
  digests: DigestModel[];
  highlighters: HighligherModel[];
  bookmarks: BookmarkModel[];
}
export interface BackupPageState {
  currentStep: number | null;
  isBackup: boolean | null;
  currentDrive: number | null;
}
class BackupPage extends React.Component<BackupPageProps, BackupPageState> {
  constructor(props: BackupPageProps) {
    super(props);
    this.state = {
      currentStep: 0,
      isBackup: null,
      currentDrive: null,
    };
  }
  handleClose = () => {
    this.props.handleBackupDialog(false);
  };
  handleBackupToLocal = () => {
    BackupUtil.backup(
      this.props.books,
      this.props.notes,
      this.props.digests,
      this.props.highlighters,
      this.props.bookmarks,
      this.handleFinish
    );
  };
  handleFinish = () => {
    this.setState({ currentStep: 2 });
  };
  handleRestoreToLocal = (event: any) => {
    event.preventDefault();
    RestoreUtil.restore(event.target.files[0], this.handleFinish);
  };
  handleDrive = async (index: number) => {
    this.setState({ currentDrive: index }, () => {
      if (this.state.currentDrive === 0) {
        this.handleBackupToLocal();
      } else {
        this.props.handleMessage("Coming Soon");
        this.props.handleMessageBox(true);
      }
    });
  };
  render() {
    console.log(this.state.isBackup === true, this.state.isBackup === false);
    const renderDrivePage = () => {
      return driveList.map((item, index) => {
        return (
          <li
            key={item.id}
            className="backup-page-list-item"
            onClick={async () => {
              this.handleDrive(index);
            }}
            style={index === 0 ? { opacity: 1 } : {}}
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

    return (
      <div className="backup-page-container">
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
                multiple={true}
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
const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    digests: state.reader.digests,
    highlighters: state.reader.highlighters,
  };
};
const actionCreator = {
  handleBackupDialog,
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(BackupPage as any));
