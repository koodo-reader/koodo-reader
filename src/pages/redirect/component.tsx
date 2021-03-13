import React from "react";
import "./manager.css";
import { RedirectProps, RedirectState } from "./interface";
import { Trans } from "react-i18next";
import { getParamsFromUrl } from "../../utils/syncUtils/common";
import copy from "copy-text-to-clipboard";
import { withRouter } from "react-router-dom";
import { isMobile } from "react-device-detect";
import OtherUtil from "../../utils/otherUtil";
import DropboxUtil from "../../utils/syncUtils/dropbox";
import Lottie from "react-lottie";
import animationSuccess from "../../assets/lotties/success.json";

const successOptions = {
  loop: false,
  autoplay: true,
  animationData: animationSuccess,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};

declare var window: any;

class Redirect extends React.Component<RedirectProps, RedirectState> {
  timer!: NodeJS.Timeout;
  constructor(props: RedirectProps) {
    super(props);
    this.state = {
      isAuthed: false,
      isError: false,
      isCopied: false,
      token: "",
    };
  }
  handleFinish = () => {
    this.props.handleLoadingDialog(false);
    alert("数据恢复成功");
  };
  showMessage = (message: string) => {
    this.props.handleMessage(message);
    this.props.handleMessageBox(true);
  };
  componentDidMount() {
    //判断是否是获取token后的回调页面
    let url = document.location.href;
    if (document.location.hash === "#/") {
      this.props.history.push("/manager/home");
    }
    if (url.indexOf("error") > -1) {
      this.setState({ isError: true });
      return false;
    }
    if (url.indexOf("code") > -1) {
      let params: any = getParamsFromUrl();
      this.setState({ token: params.code });
      this.setState({ isAuthed: true });
      return false;
    }
    if (url.indexOf("access_token") > -1) {
      let params: any = getParamsFromUrl();
      this.setState({ token: params.access_token });
      this.setState({ isAuthed: true });
      if (isMobile) {
        OtherUtil.setReaderConfig(`dropbox_token`, params.access_token);
        DropboxUtil.DownloadFile(
          (mobileData) => {
            window.ReactNativeWebView.postMessage(mobileData);
          },
          () => {}
        );
      }
      return false;
    }
    if (url.indexOf("mobile_first_open") > -1) {
      DropboxUtil.DownloadFile(
        (mobileData) => {
          window.ReactNativeWebView.postMessage(mobileData);
        },
        () => {}
      );
    }
    if (url.indexOf("mobile_sync") > -1) {
      DropboxUtil.DownloadFile(
        (mobileData) => {
          window.ReactNativeWebView.postMessage(mobileData);
        },
        () => {},
        true
      );
    }
  }

  render() {
    if (this.state.isError || this.state.isAuthed) {
      return (
        <div className="backup-page-finish-container">
          <div className="backup-page-finish">
            {this.state.isAuthed ? (
              <Lottie options={successOptions} height={80} width={80} />
            ) : (
              <span className="icon-close auth-page-close-icon"></span>
            )}

            <div className="backup-page-finish-text">
              <Trans>
                {this.state.isAuthed
                  ? "Authorize Successfully"
                  : "Authorize Failed"}
              </Trans>
            </div>
            {this.state.isAuthed ? (
              <div
                className="token-dialog-token-text"
                onClick={() => {
                  copy(this.state.token);
                  this.setState({ isCopied: true });
                }}
              >
                {this.state.isCopied ? (
                  <Trans>Copied</Trans>
                ) : (
                  <Trans>Copy Token</Trans>
                )}
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div className="manager">
        <img
          src={
            process.env.NODE_ENV === "production"
              ? "./assets/logo.png"
              : "../../assets/logo.png"
          }
          alt=""
          className="logo"
        />
        <div className="empty-page-info-container" style={{ margin: 100 }}>
          <div className="empty-page-info-main">
            <Trans>It seems like you're lost</Trans>
          </div>
          <div
            className="empty-page-info-sub"
            onClick={() => {
              this.props.history.push("/manager/home");
            }}
            style={{ marginTop: 10, cursor: "pointer" }}
          >
            <Trans>Return to home</Trans>
          </div>
        </div>
        <img
          src={
            process.env.NODE_ENV === "production"
              ? "./assets/empty.svg"
              : "../../assets/empty.svg"
          }
          alt=""
          className="empty-page-illustration"
        />
      </div>
    );
  }
}

export default withRouter(Redirect);
