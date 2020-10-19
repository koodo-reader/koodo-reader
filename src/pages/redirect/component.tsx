import React from "react";
import "./manager.css";
import { RedirectProps, RedirectState } from "./interface";
import { Trans } from "react-i18next";
import { getParamsFromUrl } from "../../utils/syncUtils/common";
import copy from "copy-text-to-clipboard";
import { withRouter } from "react-router-dom";
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

  componentDidMount() {
    //判断是否是获取token后的回调页面
    let url = document.location.href;
    if (url.indexOf("error") > -1) {
      this.setState({ isError: true });
      return false;
    }
    if (url.indexOf("code") > -1) {
      let params: any = getParamsFromUrl();
      console.log(params, "params");
      this.setState({ token: params.code });
      this.setState({ isAuthed: true });
      return false;
    }
    if (url.indexOf("access_token") > -1) {
      let params: any = getParamsFromUrl();
      console.log(params, "params");
      this.setState({ token: params.access_token });
      this.setState({ isAuthed: true });
      return false;
    }
  }

  render() {
    if (this.state.isError || this.state.isAuthed) {
      return (
        <div className="backup-page-finish-container">
          <div className="backup-page-finish">
            {this.state.isAuthed ? (
              <span className="icon-message backup-page-finish-icon"></span>
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

    return <div className="manager">你似乎来到了没有知识的荒原</div>;
  }
}

export default withRouter(Redirect);
