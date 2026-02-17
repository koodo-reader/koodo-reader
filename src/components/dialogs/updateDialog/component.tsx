import React from "react";
import "./updateInfo.css";
import { UpdateInfoProps, UpdateInfoState } from "./interface";
import packageInfo from "../../../../package.json";
import { Trans } from "react-i18next";
import Lottie from "react-lottie";
import animationNew from "../../../assets/lotties/new.json";
import {
  compareVersions,
  getWebsiteUrl,
  openExternalUrl,
} from "../../../utils/common";
import { isElectron } from "react-device-detect";
import { sleep } from "../../../utils/common";
import {
  checkDeveloperUpdate,
  checkStableUpdate,
  handleClearToken,
} from "../../../utils/request/common";
import {
  ConfigService,
  TokenService,
} from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import { isWindows } from "react-device-detect";
const newOptions = {
  loop: false,
  autoplay: true,
  animationData: animationNew,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};

class UpdateInfo extends React.Component<UpdateInfoProps, UpdateInfoState> {
  constructor(props: UpdateInfoProps) {
    super(props);
    this.state = {
      updateLog: "",
      progress: 0,
      downloadedMB: 0,
      totalMB: 0,
      isDownloading: false,
    };
  }
  async componentDidMount() {
    if (!this.props.currentBook.key) {
      if (!isElectron) {
        return;
      }
      let res;
      if (ConfigService.getReaderConfig("updateChannel") === "stable") {
        res = await checkStableUpdate();
      } else {
        res = await checkDeveloperUpdate();
      }
      const newVersion = res.version;
      await sleep(500);
      if (
        res.stable === "no" &&
        ConfigService.getReaderConfig("skipVersion") === newVersion
      ) {
        return;
      }
      if ((process as any).windowsStore) {
        return;
      }
      if (compareVersions(newVersion, packageInfo.version) > 0) {
        if (
          ConfigService.getReaderConfig("isDisableUpdate") !== "yes" ||
          this.props.isAuthed
        ) {
          this.setState({ updateLog: res });
          this.props.handleNewDialog(true);
        } else {
          this.props.handleNewWarning(true);
        }
      }
    }
  }
  renderList = (arr: any[]) => {
    return arr.map((item, index) => {
      return (
        <li className="update-dialog-list" key={index}>
          <span>{index + 1 + ". "}</span>
          <span>{item}</span>
        </li>
      );
    });
  };

  handleClose = () => {
    this.props.handleNewDialog(false);
  };

  render() {
    return (
      <>
        {this.state.updateLog && this.props.isShowNew && (
          <div className="new-version">
            <div className="new-version-title">
              <Trans>Update to</Trans>
              {" " + this.state.updateLog.version}
              <div
                className="new-version-badge"
                style={{
                  backgroundColor:
                    this.state.updateLog.stable === "yes"
                      ? "rgba(94, 178, 148, 1)"
                      : "rgba(92, 143, 211, 1)",
                }}
              >
                {this.props.t(
                  this.state.updateLog.stable === "yes"
                    ? "Stable version"
                    : "Developer version"
                )}
              </div>
            </div>
            {(this.props.isAuthed &&
              this.state.updateLog.skippable === "yes") ||
            !this.props.isAuthed ? (
              <div
                className="setting-close-container"
                onClick={() => {
                  this.handleClose();
                }}
              >
                <span className="icon-close setting-close"></span>
              </div>
            ) : (
              <div
                className="update-log-out-button"
                style={{}}
                onClick={async () => {
                  await handleClearToken();
                  this.props.handleFetchAuthed();
                  this.props.handleFetchDataSourceList();
                  this.props.handleFetchDefaultSyncOption();
                  this.props.handleLoginOptionList([]);
                  toast.success(this.props.t("Log out successful"));
                  this.handleClose();
                }}
              >
                {this.props.t("Exit Pro")}
              </div>
            )}
            <div className="update-dialog-info" style={{ height: 420 }}>
              <div className="new-version-animation">
                <Lottie options={newOptions} height={220} width={220} />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <div
                  className="new-version-open"
                  onClick={() => {
                    if (isWindows) {
                      const { ipcRenderer } = window.require("electron");
                      if (!this.state.isDownloading) {
                        // 先注册事件监听器，再调用下载
                        this.setState({ isDownloading: true });
                        ipcRenderer.on(
                          "download-app-progress",
                          (_event: any, config: any) => {
                            this.setState({
                              progress: config.progress,
                              downloadedMB: config.downloadedMB,
                              totalMB: config.totalMB,
                            });
                            toast.loading(
                              this.props.t("Downloading") +
                                `(${config.downloadedMB} / ${config.totalMB} MB)`,
                              { id: "download-progress" }
                            );
                          }
                        );
                        ipcRenderer.invoke("update-win-app", {
                          version: this.state.updateLog.version,
                        });
                      } else {
                        ipcRenderer.invoke("cancel-download-app", {});
                        this.setState({
                          isDownloading: false,
                          progress: 0,
                          downloadedMB: 0,
                          totalMB: 0,
                        });
                        setTimeout(() => {
                          toast.success(
                            this.props.t("Cancellation successful"),
                            {
                              id: "download-progress",
                            }
                          );
                        }, 500);
                      }
                    } else {
                      let lang = "en";
                      if (
                        ConfigService.getReaderConfig("lang") &&
                        ConfigService.getReaderConfig("lang").startsWith("zh")
                      ) {
                        lang = "zh";
                      }
                      openExternalUrl(
                        getWebsiteUrl() +
                          "/" +
                          lang +
                          "/download" +
                          "?version=" +
                          (this.state.updateLog.stable === "yes"
                            ? "stable"
                            : "developer")
                      );
                    }
                  }}
                >
                  {this.state.isDownloading ? (
                    <Trans>Cancel</Trans>
                  ) : (
                    <Trans>Download</Trans>
                  )}
                </div>
              </div>
              {isWindows && (
                <div
                  className="new-version-skip"
                  onClick={() => {
                    let lang = "en";
                    if (
                      ConfigService.getReaderConfig("lang") &&
                      ConfigService.getReaderConfig("lang").startsWith("zh")
                    ) {
                      lang = "zh";
                    }
                    openExternalUrl(
                      getWebsiteUrl() +
                        "/" +
                        lang +
                        "/download" +
                        "?version=" +
                        (this.state.updateLog.stable === "yes"
                          ? "stable"
                          : "developer")
                    );
                  }}
                >
                  <Trans>Download in Browser</Trans>
                </div>
              )}
              {this.state.updateLog.stable !== "yes" && (
                <div
                  className="new-version-skip"
                  onClick={() => {
                    ConfigService.setReaderConfig(
                      "skipVersion",
                      this.state.updateLog.version
                    );
                    this.handleClose();
                  }}
                >
                  <Trans>Skip this version</Trans>
                </div>
              )}
              {this.state.updateLog.stable !== "yes" && (
                <div
                  className="new-version-skip"
                  onClick={() => {
                    ConfigService.setReaderConfig("updateChannel", "stable");
                    this.handleClose();
                  }}
                >
                  <Trans>Only receive stable version</Trans>
                </div>
              )}

              {this.state.updateLog && (
                <>
                  <p className="update-dialog-new-title">
                    <Trans>What's new</Trans>
                  </p>
                  <ul className="update-dialog-new-container">
                    {this.renderList(this.state.updateLog.new)}
                  </ul>
                  <p className="update-dialog-fix-title">
                    <Trans>What's been fixed</Trans>
                  </p>
                  <ul className="update-dialog-fix-container">
                    {this.renderList(this.state.updateLog.fix)}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
      </>
    );
  }
}

export default UpdateInfo;
