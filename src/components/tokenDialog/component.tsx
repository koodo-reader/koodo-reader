//绑定网盘的弹窗
import React, { Component } from "react";
import "./tokenDialog.css";
import copy from "copy-text-to-clipboard";
import { Trans } from "react-i18next";
import { TokenDialogProps, TokenDialogState } from "./interface";
import OtherUtil from "../../utils/otherUtil";
import OnedriveUtil from "../../utils/syncUtils/onedrive";

class TokenDialog extends Component<TokenDialogProps, TokenDialogState> {
  constructor(props: TokenDialogProps) {
    super(props);
    this.state = { isNew: false };
  }

  handleCancel = () => {
    this.props.handleTokenDialog(false);
  };
  handleComfirm = () => {
    let token: string = (document.querySelector(
      ".token-dialog-token-box"
    ) as HTMLTextAreaElement).value;
    OtherUtil.setReaderConfig(`${this.props.driveName}_token`, token);
    this.handleOAuth(this.props.driveName);
    this.props.handleTokenDialog(false);
    this.props.handleMessage("Add Successfully");
    this.props.handleMessageBox(true);
  };
  handleOAuth(driveName: string) {
    if (driveName === "onedrive") {
      OnedriveUtil.GetAccessToken();
    }
  }
  render() {
    return (
      <div className="token-dialog-container">
        <div className="token-dialog-box">
          <div className="token-dialog-title">
            <Trans>Bind</Trans>
            {this.props.driveName}
            <Trans>Token</Trans>
          </div>
          <div className="token-dialog-info-text">
            <Trans>Token Info</Trans>
          </div>
          <div
            className="token-dialog-link-text"
            onClick={() => {
              copy(this.props.url);
              this.props.handleMessage("Copy Successfully");
              this.props.handleMessageBox(true);
            }}
          >
            <Trans>Copy Link</Trans>
          </div>
          <textarea className="token-dialog-token-box" />
          <div
            className="token-dialog-cancel"
            onClick={() => {
              this.handleCancel();
            }}
          >
            <Trans>Cancel</Trans>
          </div>
          <div
            className="token-dialog-comfirm"
            onClick={() => {
              this.handleComfirm();
            }}
          >
            <Trans>Confirm</Trans>
          </div>
        </div>
      </div>
    );
  }
}

export default TokenDialog;
