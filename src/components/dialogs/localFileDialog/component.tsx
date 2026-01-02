import React from "react";
import "./localFileDialog.css";
import { Trans } from "react-i18next";
import { LocalFileDialogProps, LocalFileDialogState } from "./interface";
import Lottie from "react-lottie";
import animationSuccess from "../../../assets/lotties/success.json";
import animationSafe from "../../../assets/lotties/safe.json";
import _ from "underscore";
import toast from "react-hot-toast";
import { isElectron } from "react-device-detect";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  exportToLocalFile,
  LocalFileManager,
} from "../../../utils/file/localFile";
const successOptions = {
  loop: false,
  autoplay: true,
  animationData: animationSuccess,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};
const safeOptions = {
  loop: false,
  autoplay: true,
  animationData: animationSafe,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};
class LocalFileDialog extends React.Component<
  LocalFileDialogProps,
  LocalFileDialogState
> {
  constructor(props: LocalFileDialogProps) {
    super(props);
    this.state = {
      isFinish: false,
      hasLocalAccess: false,
      status: {
        hasAccess: false,
        needsReauthorization: false,
        directoryName: "",
      },
    };
  }
  async componentDidMount() {
    if (!isElectron) {
      const status = await LocalFileManager.getPermissionStatus();
      this.setState({
        status,
      });
    }
  }
  handleClose = () => {
    this.props.handleLocalFileDialog(false);
  };
  showMessage = (message: string) => {
    toast(this.props.t(message));
  };
  handleSelectFolder = async () => {
    if (!LocalFileManager.isSupported()) {
      this.showMessage("Your browser doesn't support local file access");
      return;
    }

    try {
      const directoryHandle = await LocalFileManager.requestDirectoryAccess();

      if (directoryHandle) {
        // 成功获取权限

        toast.loading(
          this.props.t("Granting access to local folder, please wait"),
          {
            id: "local-folder-access",
          }
        );
        let fileList = await LocalFileManager.listFiles("config");
        if (fileList.length > 0 && fileList.indexOf("books.db") > -1) {
        } else {
          await exportToLocalFile();
        }
        toast.dismiss("local-folder-access");
        this.setState({
          isFinish: true,
          hasLocalAccess: true,
        });
        ConfigService.setReaderConfig("isUseLocal", "yes");
        ConfigService.setReaderConfig(
          "localDirectoryName",
          directoryHandle.name
        );
        this.showMessage("Local folder access granted successfully");
        this.props.handleFetchBooks();
        setTimeout(() => {
          this.props.history.push("/manager/home");
        }, 2000);
      } else {
        this.showMessage("Failed to get folder access permission");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error("Error selecting folder:" + errorMessage);
      console.error("Error selecting folder:", error);
      this.showMessage("Error occurred while selecting folder");
    }
  };
  render() {
    return (
      <div
        className="backup-page-container"
        style={{ height: "300px", top: "calc(50% - 150px)" }}
      >
        <div className="add-dialog-title">
          <Trans>Never lose your data</Trans>
        </div>
        {!this.state.isFinish ? (
          <div
            className="backup-page-option"
            style={{ bottom: "0px", top: "0px" }}
          >
            <div className="backup-page-finish">
              <Lottie options={safeOptions} height={120} width={150} />
              <div className="backup-page-warning-text">
                {this.state.status.needsReauthorization ? (
                  this.props.t("Need to reauthorize the access to directory") +
                  " " +
                  this.state.status.directoryName +
                  ", " +
                  this.props.t(
                    "Please click the allow on every visit button to avoid this popup once and for all"
                  )
                ) : (
                  <Trans>
                    Grant access to local folder to save your data and reduce
                    the risk of data loss
                  </Trans>
                )}
              </div>
            </div>
            <div className="add-dialog-button-container">
              <div
                className="add-dialog-cancel"
                style={{ borderWidth: 0, marginRight: "20px" }}
                onClick={() => {
                  ConfigService.setReaderConfig("isUseLocal", "no");
                  this.handleClose();
                }}
              >
                <Trans>Continue to store in the browser</Trans>
              </div>
              {this.state.status.needsReauthorization ? (
                <div
                  className="add-dialog-confirm"
                  onClick={async () => {
                    await LocalFileManager.ensureDirectoryAccess();
                    this.setState({
                      hasLocalAccess: true,
                      isFinish: true,
                    });

                    this.props.handleFetchBooks();
                    setTimeout(() => {
                      this.props.history.push("/manager/home");
                    }, 2000);
                  }}
                >
                  <Trans>Authorize</Trans>
                </div>
              ) : (
                <div
                  className="add-dialog-confirm"
                  onClick={() => {
                    this.handleSelectFolder();
                  }}
                >
                  <Trans>Select folder</Trans>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="backup-page-finish-container">
            <div className="backup-page-finish">
              <Lottie options={successOptions} height={80} width={80} />
              <div className="backup-page-finish-text">
                <Trans>Setup successful</Trans>
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

export default LocalFileDialog;
