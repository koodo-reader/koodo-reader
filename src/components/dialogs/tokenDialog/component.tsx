import React, { Component } from "react";
import "./tokenDialog.css";
import { Trans } from "react-i18next";
import { TokenDialogProps, TokenDialogState } from "./interface";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import toast from "react-hot-toast";
import { openExternalUrl } from "../../../utils/serviceUtils/urlUtil";
import axios from "axios";
import { driveConfig } from "../../../constants/driveList";
class TokenDialog extends Component<TokenDialogProps, TokenDialogState> {
  constructor(props: TokenDialogProps) {
    super(props);
    this.state = { isNew: false };
  }

  handleCancel = () => {
    this.props.handleTokenDialog(false);
  };
  handleDropboxComfirm = () => {
    let token: string = (
      document.querySelector("#token-dialog-token-box") as HTMLTextAreaElement
    ).value;
    StorageUtil.setReaderConfig(
      `${this.props.driveName.toLowerCase()}_token`,
      token
    );
    this.props.handleTokenDialog(false);
    toast.success(this.props.t("Add Successfully"));
  };
  handleOneDriveComfirm = async () => {
    let code: string = (
      document.querySelector("#token-dialog-token-box") as HTMLTextAreaElement
    ).value;
    let res = await axios.post(driveConfig.onedriveAuthUrl, {
      code,
      redirect_uri: driveConfig.callbackUrl,
    });
    StorageUtil.setReaderConfig(
      `${this.props.driveName.toLowerCase()}_token`,
      res.data.refresh_token
    );
    this.props.handleTokenDialog(false);
    toast.success(this.props.t("Add Successfully"));
  };
  handleDavComfirm = () => {
    let url: string = (
      document.querySelector("#token-dialog-url-box") as HTMLTextAreaElement
    ).value;
    let username: string = (
      document.querySelector(
        "#token-dialog-username-box"
      ) as HTMLTextAreaElement
    ).value;
    let password: string = (
      document.querySelector(
        "#token-dialog-password-box"
      ) as HTMLTextAreaElement
    ).value;
    StorageUtil.setReaderConfig(
      `${this.props.driveName.toLowerCase()}_token`,
      JSON.stringify({ url, username, password })
    );
    this.props.handleTokenDialog(false);
    toast.success(this.props.t("Add Successfully"));
  };
  handleFTPComfirm = () => {
    let url: string = (
      document.querySelector("#token-dialog-url-box") as HTMLTextAreaElement
    ).value;
    let username: string = (
      document.querySelector(
        "#token-dialog-username-box"
      ) as HTMLTextAreaElement
    ).value;
    let password: string = (
      document.querySelector(
        "#token-dialog-password-box"
      ) as HTMLTextAreaElement
    ).value;
    let dir: string = (
      document.querySelector("#token-dialog-path-box") as HTMLTextAreaElement
    ).value;
    let ssl: string = (
      document.querySelector("#token-dialog-ssl-box") as HTMLTextAreaElement
    ).value;
    StorageUtil.setReaderConfig(
      `${this.props.driveName.toLowerCase()}_token`,
      JSON.stringify({ url, username, password, dir, ssl })
    );
    this.props.handleTokenDialog(false);
    toast.success(this.props.t("Add Successfully"));
  };
  handleSFTPComfirm = () => {
    let url: string = (
      document.querySelector("#token-dialog-url-box") as HTMLTextAreaElement
    ).value;
    let username: string = (
      document.querySelector(
        "#token-dialog-username-box"
      ) as HTMLTextAreaElement
    ).value;
    let password: string = (
      document.querySelector(
        "#token-dialog-password-box"
      ) as HTMLTextAreaElement
    ).value;
    let dir: string = (
      document.querySelector("#token-dialog-path-box") as HTMLTextAreaElement
    ).value;
    let port: string = (
      document.querySelector("#token-dialog-port-box") as HTMLTextAreaElement
    ).value;
    StorageUtil.setReaderConfig(
      `${this.props.driveName.toLowerCase()}_token`,
      JSON.stringify({ url, username, password, dir, port })
    );
    this.props.handleTokenDialog(false);
    toast.success(this.props.t("Add Successfully"));
  };
  handleJump = (url: string) => {
    openExternalUrl(url);
  };
  render() {
    return (
      <div className="token-dialog-container">
        <div className="token-dialog-box">
          <div className="token-dialog-title">
            <Trans>Authorize</Trans>
            &nbsp;
            {this.props.driveName}&nbsp;
            <Trans>Token</Trans>
          </div>
          {this.props.driveName === "WebDAV" ? (
            <>
              <div
                className="token-dialog-info-text"
                style={
                  StorageUtil.getReaderConfig("lang") === "en"
                    ? { fontSize: "14px" }
                    : {}
                }
              >
                <Trans>WebDAV Info</Trans>
              </div>
              <input
                type="text"
                name="url"
                placeholder={this.props.t("Server Address")}
                id="token-dialog-url-box"
                className="token-dialog-username-box"
              />
              <input
                type="text"
                name="username"
                placeholder={this.props.t("Username")}
                id="token-dialog-username-box"
                className="token-dialog-username-box"
              />
              <input
                type="text"
                name="password"
                placeholder={this.props.t("Password")}
                id="token-dialog-password-box"
                className="token-dialog-username-box"
              />
            </>
          ) : this.props.driveName === "SFTP" ? (
            <>
              <input
                type="text"
                name="url"
                placeholder={this.props.t("Server Address")}
                id="token-dialog-url-box"
                className="token-dialog-username-box"
              />
              <input
                type="text"
                name="port"
                placeholder={this.props.t("Server port")}
                id="token-dialog-port-box"
                className="token-dialog-username-box"
              />
              <input
                type="text"
                name="path"
                placeholder={this.props.t("Server path")}
                id="token-dialog-path-box"
                className="token-dialog-username-box"
              />
              <input
                type="text"
                name="username"
                placeholder={this.props.t("Username")}
                id="token-dialog-username-box"
                className="token-dialog-username-box"
              />
              <input
                type="text"
                name="password"
                placeholder={this.props.t("Password")}
                id="token-dialog-password-box"
                className="token-dialog-password-box"
              />
            </>
          ) : this.props.driveName === "FTP" ? (
            <>
              <input
                type="text"
                name="url"
                placeholder={this.props.t("Server Address")}
                id="token-dialog-url-box"
                className="token-dialog-username-box"
              />
              <input
                type="text"
                name="path"
                placeholder={this.props.t("Server path")}
                id="token-dialog-path-box"
                className="token-dialog-url-box"
              />
              <input
                type="text"
                name="username"
                placeholder={this.props.t("Username")}
                id="token-dialog-username-box"
                className="token-dialog-username-box"
              />
              <input
                type="text"
                name="password"
                placeholder={this.props.t("Password")}
                id="token-dialog-password-box"
                className="token-dialog-password-box"
              />
              <input
                type="text"
                name="ssl"
                placeholder={this.props.t("Use SSL, 1 for use, 0 for not use")}
                id="token-dialog-ssl-box"
                className="token-dialog-password-box"
              />
            </>
          ) : (
            <>
              <div
                className="token-dialog-info-text"
                style={
                  StorageUtil.getReaderConfig("lang") === "en"
                    ? { fontSize: "14px" }
                    : {}
                }
              >
                <Trans>
                  Please authorize your account, and fill the following box with
                  the token
                </Trans>
              </div>
              <div
                className="token-dialog-link-text"
                onClick={() => {
                  this.handleJump(this.props.url);
                }}
              >
                <Trans>Authorize</Trans>
              </div>
              <textarea
                className="token-dialog-token-box"
                id="token-dialog-token-box"
              />
            </>
          )}

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
              if (this.props.driveName === "WebDAV") {
                this.handleDavComfirm();
              } else if (this.props.driveName === "FTP") {
                this.handleFTPComfirm();
              } else if (this.props.driveName === "SFTP") {
                this.handleSFTPComfirm();
              } else if (this.props.driveName === "Dropbox") {
                this.handleDropboxComfirm();
              } else {
                this.handleOneDriveComfirm();
              }
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
