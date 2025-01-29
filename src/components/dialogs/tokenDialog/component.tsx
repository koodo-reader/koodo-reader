import React, { Component } from "react";
import "./tokenDialog.css";
import { Trans } from "react-i18next";
import { TokenDialogProps, TokenDialogState } from "./interface";
import ConfigService from "../../../utils/storage/configService";
import { SyncUtil } from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import { openExternalUrl } from "../../../utils/common";
import { driveInputConfig, driveList } from "../../../constants/driveList";
class TokenDialog extends Component<TokenDialogProps, TokenDialogState> {
  constructor(props: TokenDialogProps) {
    super(props);
    this.state = { isNew: false, config: {} };
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
  handleConfirm = async () => {
    if (
      this.props.driveName === "webdav" ||
      this.props.driveName === "ftp" ||
      this.props.driveName === "sftp" ||
      this.props.driveName === "s3compatible"
    ) {
      ConfigService.setReaderConfig(
        `${this.props.driveName}_token`,
        JSON.stringify(this.state.config)
      );
    } else {
      let syncUtil = new SyncUtil(this.props.driveName, {});
      let refreshToken = await syncUtil.authToken(this.state.config.token);
      ConfigService.setReaderConfig(
        `${this.props.driveName}_token`,
        JSON.stringify({ refresh_token: refreshToken })
      );
    }

    this.props.handleTokenDialog(false);
    toast.success(this.props.t("Addition successful"));
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
          {this.props.driveName === "webdav" ||
          this.props.driveName === "ftp" ||
          this.props.driveName === "sftp" ||
          this.props.driveName === "s3compatible" ? (
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
                  {
                    driveList.find(
                      (item) => item.value === this.props.driveName
                    )!.label
                  }{" "}
                  Info
                </Trans>
              </div>
              {driveInputConfig[this.props.driveName].map((item) => {
                return (
                  <input
                    type={item.type}
                    name={item.value}
                    placeholder={
                      this.props.t(item.label) + ", " + item.placeholder
                    }
                    onChange={(e) => {
                      this.setState((prevState) => ({
                        config: {
                          ...prevState.config,
                          [item.value]: e.target.value,
                        },
                      }));
                    }}
                    id={"token-dialog-" + item.value + "-box"}
                    className="token-dialog-username-box"
                  />
                );
              })}
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
                placeholder={this.props.t("Token")}
                onChange={(e) => {
                  this.setState((prevState) => ({
                    config: {
                      ...prevState.config,
                      token: e.target.value,
                    },
                  }));
                }}
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
                this.handleConfirm();
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
