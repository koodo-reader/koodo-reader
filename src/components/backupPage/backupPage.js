//备份和恢复页面
import React, { Component } from "react";
import "./backupPage.css";
import { driveList } from "../../utils/readerConfig";
import { handleBackup } from "../../redux/backupPage.redux";
import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../redux/manager.redux";
import BackupUtil from "../../utils/backupUtil";
import RestoreUtil from "../../utils/restoreUtil";
class BackupPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentStep: 0,
      isBackup: null,
      drive: null,
      currentDrive: null
    };
  }
  handleClose = () => {
    this.props.handleBackup(false);
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
  handleRestoreToLocal = event => {
    event.preventDefault();
    // console.log(event.target.files);
    RestoreUtil.restore(event.target.files[0], this.handleFinish);
  };
  handleDrive = async index => {
    // console.log(index, "insghsgahs");
    await this.setState({ currentDrive: index });
    if (this.state.currentDrive === 0) {
      this.handleBackupToLocal();
    } else {
      this.props.handleMessage("敬请期待");
      this.props.handleMessageBox(true);
    }
  };
  render() {
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
              <div className="backup-page-list-title">{item.name}</div>
            </div>
          </li>
        );
      });
    };

    return (
      <div className="backup-page-container">
        {this.state.currentStep === 0 ? (
          <div className="backup-page-title">您想要备份还是恢复</div>
        ) : this.state.currentStep === 1 && this.state.isBackup === "backup" ? (
          <div className="backup-page-title">您想把数据存在哪里</div>
        ) : this.state.currentStep === 1 &&
          this.state.isBackup === "restore" ? (
          <div className="backup-page-title">您的数据保存在哪里</div>
        ) : null}
        {this.state.currentStep === 0 ? (
          <div className="backup-page-option">
            <div
              className={
                this.state.isBackup === "backup"
                  ? "backup-page-backup active"
                  : "backup-page-backup"
              }
              onClick={() => {
                this.setState({ isBackup: "backup" });
              }}
            >
              <span className="icon-backup"></span>
              <div>我要备份</div>
            </div>

            <div
              className={
                this.state.isBackup === "restore"
                  ? "backup-page-backup active"
                  : "backup-page-backup"
              }
              onClick={() => {
                this.setState({ isBackup: "restore" });
              }}
            >
              <span className="icon-restore"></span>
              <div>我要恢复</div>
            </div>
          </div>
        ) : this.state.currentStep === 1 ? (
          <div className="backup-page-drive-container">
            <div>{renderDrivePage()}</div>
            {this.state.isBackup === "restore" ? (
              <input
                type="file"
                id="restore-file"
                accept="application/zip"
                className="restore-file"
                name="file"
                multiple="multiple"
                onChange={event => {
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
                {this.state.isBackup === "backup" ? "备份成功" : "恢复成功"}
              </div>
              {this.state.isBackup === "backup" ? null : (
                <div style={{ opacity: 0.6 }}>刷新后生效</div>
              )}
            </div>
          </div>
        )}
        {this.state.isBackup === "backup" && this.state.currentStep === 0 ? (
          <div className="backup-page-backup-selector"></div>
        ) : null}
        {this.state.isBackup === "restore" && this.state.currentStep === 0 ? (
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
            上一步
          </div>
        ) : this.state.currentStep === 0 ? (
          <div
            className="backup-page-next"
            onClick={() => {
              this.setState({ currentStep: 1 });
            }}
            style={this.state.isBackup !== null ? {} : { display: "none" }}
          >
            下一步
          </div>
        ) : null}
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    books: state.manager.books,
    covers: state.manager.covers,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    digests: state.reader.digests,
    highlighters: state.reader.highlighters
  };
};
const actionCreator = {
  handleBackup,
  handleMessageBox,
  handleMessage
};
BackupPage = connect(mapStateToProps, actionCreator)(BackupPage);
export default BackupPage;
