import React from "react";
import "./backupDialog.css";
import { driveList } from "../../../constants/driveList";
import { backup } from "../../../utils/file/backup";
import { restore } from "../../../utils/file/restore";
import { Trans } from "react-i18next";
import { BackupDialogProps, BackupDialogState } from "./interface";
import ConfigService from "../../../utils/storage/configService";
import Lottie from "react-lottie";
import animationSuccess from "../../../assets/lotties/success.json";
import packageInfo from "../../../../package.json";
import _ from "underscore";
import toast from "react-hot-toast";
import { isElectron } from "react-device-detect";
import { SyncUtil } from "../../../assets/lib/kookit-extra-browser.min";
import { checkStableUpdate } from "../../../utils/request/common";

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
        this.showMessage("Upload failed, check your connection");
      }
      return;
    }

    if (!ConfigService.getReaderConfig(name + "_token") && name !== "local") {
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

    if (!ConfigService.getReaderConfig(name + "_token")) {
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
    if (
      (event.target.value === "ftp" ||
        event.target.value === "webdav" ||
        event.target.value === "sftp") &&
      !isElectron
    ) {
      toast(
        this.props.t(
          "Koodo Reader's web version are limited by the browser, for more powerful features, please download the desktop version."
        )
      );
      return;
    }
    if (
      event.target.value === "google" ||
      event.target.value === "s3compatible" ||
      event.target.value === "microsoft" ||
      event.target.value === "dropbox"
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
  render() {
    return (
      <div className="backup-page-container">
        {this.state.currentStep === 0 ? (
          <div className="backup-page-option">
            <div className="backup-page-backup">
              <span
                className="icon-backup"
                onClick={() => {
                  this.setState({ currentStep: 1, isBackup: "yes" });
                  this.handleBackup();
                }}
              ></span>
              <div style={{ lineHeight: 1.0, fontSize: 15 }}>
                <Trans>Backup to</Trans>
                <select
                  name=""
                  className="backup-source-dropdown"
                  onChange={this.handleSelectSource}
                >
                  {[...driveList, { label: "Add data source", value: "add" }]
                    .filter(
                      (item) =>
                        this.props.dataSourceList.includes(item.value) ||
                        item.value === "local" ||
                        item.value === "add"
                    )
                    .map((item) => (
                      <option
                        value={item.value}
                        key={item.value}
                        className="lang-setting-option"
                      >
                        {this.props.t(item.label)}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="backup-page-backup">
              <span
                className="icon-restore"
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
                  this.setState({ currentStep: 1, isBackup: "no" });
                  this.handleRestore();
                }}
              ></span>
              <div style={{ lineHeight: 1.0, fontSize: 15 }}>
                <Trans>Restore from</Trans>
                <select
                  name=""
                  className="backup-source-dropdown"
                  onChange={this.handleSelectSource}
                >
                  {[...driveList, { label: "Add data source", value: "add" }]
                    .filter(
                      (item) =>
                        this.props.dataSourceList.includes(item.value) ||
                        item.value === "local" ||
                        item.value === "add"
                    )
                    .map((item) => (
                      <option
                        value={item.value}
                        key={item.value}
                        className="lang-setting-option"
                      >
                        {this.props.t(item.label)}
                      </option>
                    ))}
                </select>
              </div>
            </div>
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
            </div>
          </div>
        )}
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

export default BackupDialog;
