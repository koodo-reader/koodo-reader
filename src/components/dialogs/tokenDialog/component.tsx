import React, { Component } from "react";
import "./tokenDialog.css";
import { Trans } from "react-i18next";
import { TokenDialogProps, TokenDialogState } from "./interface";
import ConfigService from "../../../utils/storage/configService";
import { SyncUtil } from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import { openExternalUrl } from "../../../utils/common";
class TokenDialog extends Component<TokenDialogProps, TokenDialogState> {
  constructor(props: TokenDialogProps) {
    super(props);
    this.state = { isNew: false };
  }

  handleCancel = () => {
    this.props.handleTokenDialog(false);
  };
  handleDropboxComfirm = async () => {
    let code: string = (
      document.querySelector("#token-dialog-token-box") as HTMLTextAreaElement
    ).value;
    let syncUtil = new SyncUtil("dropbox", {});
    let refreshToken = await syncUtil.authToken(code);
    ConfigService.setReaderConfig(
      `${this.props.driveName}_token`,
      JSON.stringify({ refresh_token: refreshToken })
    );
    this.props.handleTokenDialog(false);
    toast.success(this.props.t("Addition successful"));
  };
  handleOneDriveComfirm = async () => {
    let code: string = (
      document.querySelector("#token-dialog-token-box") as HTMLTextAreaElement
    ).value;
    let syncUtil = new SyncUtil("onedrive", {});
    let refreshToken = await syncUtil.authToken(code);
    ConfigService.setReaderConfig(
      `${this.props.driveName}_token`,
      JSON.stringify({ refresh_token: refreshToken })
    );
    this.props.handleTokenDialog(false);
    toast.success(this.props.t("Addition successful"));
  };
  handleGoogleDriveComfirm = async () => {
    let code: string = (
      document.querySelector("#token-dialog-token-box") as HTMLTextAreaElement
    ).value;
    let syncUtil = new SyncUtil("googledrive", {});
    let refreshToken = await syncUtil.authToken(code);
    ConfigService.setReaderConfig(
      `${this.props.driveName}_token`,
      JSON.stringify({ refresh_token: refreshToken })
    );
    this.props.handleTokenDialog(false);
    toast.success(this.props.t("Addition successful"));
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
    ConfigService.setReaderConfig(
      `${this.props.driveName}_token`,
      JSON.stringify({ url, username, password })
    );
    this.props.handleTokenDialog(false);
    toast.success(this.props.t("Addition successful"));
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
    ConfigService.setReaderConfig(
      `${this.props.driveName}_token`,
      JSON.stringify({ url, username, password, dir, ssl })
    );
    this.props.handleTokenDialog(false);
    toast.success(this.props.t("Addition successful"));
  };
  handleS3Comfirm = () => {
    let endpoint: string = (
      document.querySelector(
        "#token-dialog-endpoint-box"
      ) as HTMLTextAreaElement
    ).value;
    let region: string = (
      document.querySelector("#token-dialog-region-box") as HTMLTextAreaElement
    ).value;
    let bucketName: string = (
      document.querySelector("#token-dialog-bucket-box") as HTMLTextAreaElement
    ).value;
    let accessKeyId: string = (
      document.querySelector("#token-dialog-id-box") as HTMLTextAreaElement
    ).value;
    let secretAccessKey: string = (
      document.querySelector("#token-dialog-key-box") as HTMLTextAreaElement
    ).value;
    ConfigService.setReaderConfig(
      `${this.props.driveName}_token`,
      JSON.stringify({
        endpoint,
        region,
        bucketName,
        accessKeyId,
        secretAccessKey,
      })
    );
    this.props.handleTokenDialog(false);
    toast.success(this.props.t("Addition successful"));
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
    ConfigService.setReaderConfig(
      `${this.props.driveName}_token`,
      JSON.stringify({ url, username, password, dir, port })
    );
    this.props.handleTokenDialog(false);
    toast.success(this.props.t("Addition successful"));
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
            {this.props.title}&nbsp;
            <Trans>Token</Trans>
          </div>
          {this.props.driveName === "webdav" ? (
            <>
              <div
                className="token-dialog-info-text"
                style={
                  ConfigService.getReaderConfig("lang") === "en"
                    ? { fontSize: "14px" }
                    : {}
                }
              >
                <Trans>WebDAV Info</Trans>
              </div>
              <input
                type="text"
                name="url"
                placeholder={this.props.t("Server address")}
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
          ) : this.props.driveName === "sftp" ? (
            <>
              <input
                type="text"
                name="url"
                placeholder={this.props.t("Server address")}
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
                placeholder={this.props.t("Server Path")}
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
          ) : this.props.driveName === "ftp" ? (
            <>
              <input
                type="text"
                name="url"
                placeholder={this.props.t("Server address")}
                id="token-dialog-url-box"
                className="token-dialog-username-box"
              />
              <input
                type="text"
                name="path"
                placeholder={this.props.t("Server Path")}
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
          ) : this.props.driveName === "s3compatible" ? (
            <>
              <input
                type="text"
                name="url"
                placeholder={this.props.t("Endpoint")}
                id="token-dialog-endpoint-box"
                className="token-dialog-username-box"
              />
              <input
                type="text"
                name="path"
                placeholder={this.props.t("Region")}
                id="token-dialog-region-box"
                className="token-dialog-url-box"
              />
              <input
                type="text"
                name="username"
                placeholder={this.props.t("BucketName")}
                id="token-dialog-bucket-box"
                className="token-dialog-username-box"
              />
              <input
                type="text"
                name="password"
                placeholder={this.props.t("AccessKeyId")}
                id="token-dialog-id-box"
                className="token-dialog-password-box"
              />
              <input
                type="text"
                name="ssl"
                placeholder={this.props.t("SecretAccessKey")}
                id="token-dialog-key-box"
                className="token-dialog-password-box"
              />
            </>
          ) : (
            <>
              <div
                className="token-dialog-info-text"
                style={
                  ConfigService.getReaderConfig("lang") === "en"
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
          <div className="add-dialog-button-container">
            <div
              className="add-dialog-cancel"
              onClick={() => {
                this.handleCancel();
              }}
            >
              <Trans>Cancel</Trans>
            </div>
            <div
              className="add-dialog-confirm"
              onClick={() => {
                if (this.props.driveName === "webdav") {
                  this.handleDavComfirm();
                } else if (this.props.driveName === "ftp") {
                  this.handleFTPComfirm();
                } else if (this.props.driveName === "sftp") {
                  this.handleSFTPComfirm();
                } else if (this.props.driveName === "s3compatible") {
                  this.handleS3Comfirm();
                } else if (this.props.driveName === "dropbox") {
                  this.handleDropboxComfirm();
                } else if (this.props.driveName === "googledrive") {
                  this.handleGoogleDriveComfirm();
                } else if (this.props.driveName === "onedrive") {
                  this.handleOneDriveComfirm();
                }
              }}
            >
              <Trans>Confirm</Trans>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TokenDialog;
