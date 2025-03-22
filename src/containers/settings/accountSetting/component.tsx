import React from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import { isElectron } from "react-device-detect";
import _ from "underscore";
import { themeList } from "../../../constants/themeList";
import toast from "react-hot-toast";
import {
  formatTimestamp,
  handleContextMenu,
  openExternalUrl,
  WEBSITE_URL,
} from "../../../utils/common";
import { getStorageLocation } from "../../../utils/common";
import {
  CommonTool,
  ConfigService,
  KookitConfig,
  LoginHelper,
  TokenService,
} from "../../../assets/lib/kookit-extra-browser.min";
import { loginList } from "../../../constants/loginList";
import {
  getTempToken,
  getUserRequest,
  loginRegister,
} from "../../../utils/request/user";
import { handleExitApp } from "../../../utils/request/common";
import copyTextToClipboard from "copy-text-to-clipboard";
declare var window: any;
class AccountSetting extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      isAddNew: false,
      settingLogin: "",
      loginConfig: {},
      isSendingCode: false,
      countdown: 0,
    };
  }
  componentDidMount(): void {
    if (this.props.isAuthed) {
      this.props.handleFetchLoginOptionList();
      this.props.handleFetchUserInfo();
    }
  }
  handleRest = (_bool: boolean) => {
    toast.success(this.props.t("Change successful"));
  };
  handleJump = (url: string) => {
    openExternalUrl(url);
  };
  handleSetting = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any);
    ConfigService.setReaderConfig(
      stateName,
      this.state[stateName] ? "no" : "yes"
    );
    this.handleRest(this.state[stateName]);
  };
  handleAddLoginOption = (event: any) => {
    if (!event.target.value) {
      return;
    }
    this.setState({ settingLogin: event.target.value });
  };
  handleDeleteLoginOption = async (event: any) => {
    if (!event.target.value) {
      return;
    }
    if (this.props.loginOptionList.length === 1) {
      toast.error(this.props.t("At least one login option should be kept"));
      return;
    }
    toast.loading(this.props.t("Removing..."), {
      id: "remove-login-option",
    });
    let userRequest = await getUserRequest();
    let response = await userRequest.removeLogin({
      provider: event.target.value,
    });
    if (response.code === 200) {
      toast.success(this.props.t("Removal successful"), {
        id: "remove-login-option",
      });
      this.props.handleFetchLoginOptionList();
    } else if (response.code === 401) {
      toast.error(
        this.props.t("Removal failed, error code") + ": " + response.msg,
        {
          id: "remove-login-option",
        }
      );
      handleExitApp();
      return;
    } else {
      toast.error(
        this.props.t("Removal failed, error code") + ": " + response.msg,
        {
          id: "remove-login-option",
        }
      );
    }
  };
  handleCancelLoginOption = async () => {
    this.setState({ settingLogin: "" });
  };
  handleConfirmLoginOption = async () => {
    console.log(this.state.loginConfig);
    if (!this.state.loginConfig.token || !this.state.settingLogin) {
      toast.error(this.props.t("Missing parameters") + this.props.t("Token"));
      return;
    }
    this.props.handleLoadingDialog(true);
    let res = { code: 200, msg: "success" };
    if (this.props.isAuthed) {
      let userRequest = await getUserRequest();
      res = await userRequest.addLogin({
        code: this.state.loginConfig.token,
        provider: this.state.settingLogin,
        scope:
          KookitConfig.LoginAuthRequest[this.state.settingLogin].extraParams
            .scope,
        redirect_uri: KookitConfig.ThirdpartyConfig.callbackUrl,
      });
    } else {
      res = await loginRegister(
        this.state.settingLogin,
        this.state.loginConfig.token
      );
    }
    if (res.code === 200) {
      this.props.handleLoadingDialog(false);
      toast.success(this.props.t("Login successful"));
      this.props.handleFetchAuthed();
      this.props.handleFetchLoginOptionList();
      this.props.handleFetchUserInfo();
      this.setState({ settingLogin: "" });
    } else {
      this.props.handleLoadingDialog(false);
      toast.error(this.props.t("Login failed, error code") + ": " + res.msg);
    }
  };

  renderSwitchOption = (optionList: any[]) => {
    return optionList.map((item) => {
      return (
        <div
          style={item.isElectron ? (isElectron ? {} : { display: "none" }) : {}}
          key={item.propName}
        >
          <div className="setting-dialog-new-title" key={item.title}>
            <span style={{ width: "calc(100% - 100px)" }}>
              <Trans>{item.title}</Trans>
            </span>

            <span
              className="single-control-switch"
              onClick={() => {
                switch (item.propName) {
                  default:
                    this.handleSetting(item.propName);
                    break;
                }
              }}
              style={this.state[item.propName] ? {} : { opacity: 0.6 }}
            >
              <span
                className="single-control-button"
                style={
                  this.state[item.propName]
                    ? {
                        transform: "translateX(20px)",
                        transition: "transform 0.5s ease",
                      }
                    : {
                        transform: "translateX(0px)",
                        transition: "transform 0.5s ease",
                      }
                }
              ></span>
            </span>
          </div>
          <p className="setting-option-subtitle">
            <Trans>{item.desc}</Trans>
          </p>
        </div>
      );
    });
  };
  render() {
    return (
      <>
        {(this.state.settingLogin === "google" ||
          this.state.settingLogin === "microsoft" ||
          this.state.settingLogin === "github") && (
          <div
            className="voice-add-new-container"
            style={{
              marginLeft: "25px",
              width: "calc(100% - 50px)",
              fontWeight: 500,
            }}
          >
            <textarea
              className="token-dialog-token-box"
              id="token-dialog-token-box"
              placeholder={this.props.t(
                "Please authorize your account, and fill the following box with the token"
              )}
              onContextMenu={() => {
                handleContextMenu("token-dialog-token-box");
              }}
              onChange={(e) => {
                if (e.target.value) {
                  this.setState((prevState) => ({
                    loginConfig: {
                      ...prevState.loginConfig,
                      token: e.target.value.trim(),
                    },
                  }));
                }
              }}
            />
            <div className="token-dialog-button-container">
              <div
                className="voice-add-confirm"
                onClick={async () => {
                  this.handleConfirmLoginOption();
                }}
              >
                <Trans>Bind</Trans>
              </div>
              <div className="voice-add-button-container">
                <div
                  className="voice-add-cancel"
                  onClick={() => {
                    this.handleCancelLoginOption();
                  }}
                >
                  <Trans>Cancel</Trans>
                </div>

                <div
                  className="voice-add-confirm"
                  style={{ marginRight: "10px" }}
                  onClick={() => {
                    let url = LoginHelper.getAuthUrl(
                      this.state.settingLogin,
                      "manual"
                    );
                    this.handleJump(url);
                  }}
                >
                  <Trans>Authorize</Trans>
                </div>
              </div>
            </div>
          </div>
        )}
        {this.state.settingLogin === "email" && (
          <div
            className="voice-add-new-container"
            style={{
              marginLeft: "25px",
              width: "calc(100% - 50px)",
              fontWeight: 500,
            }}
          >
            <input
              type={"text"}
              name={"email"}
              placeholder={this.props.t("Enter your email")}
              onChange={(e) => {
                if (e.target.value) {
                  this.setState((prevState) => ({
                    loginConfig: {
                      ...prevState.loginConfig,
                      ["email"]: e.target.value.trim(),
                    },
                  }));
                }
              }}
              onContextMenu={() => {
                handleContextMenu("token-dialog-email-box", true);
              }}
              id={"token-dialog-email-box"}
              className="token-dialog-username-box"
            />
            <input
              type={"text"}
              name={"code"}
              placeholder={this.props.t("Enter code")}
              onChange={(e) => {
                if (e.target.value) {
                  this.setState((prevState) => ({
                    loginConfig: {
                      ...prevState.loginConfig,
                      ["token"]:
                        this.state.loginConfig.email +
                        "#" +
                        e.target.value.trim(),
                    },
                  }));
                }
              }}
              onContextMenu={() => {
                handleContextMenu("token-dialog-token-box", true);
              }}
              id={"token-dialog-email-box"}
              className="token-dialog-token-box"
            />
            <div className="token-dialog-button-container">
              <div
                className="voice-add-confirm"
                onClick={async () => {
                  this.handleConfirmLoginOption();
                }}
              >
                <Trans>Bind</Trans>
              </div>
              <div className="voice-add-button-container">
                <div
                  className="voice-add-cancel"
                  onClick={() => {
                    this.handleCancelLoginOption();
                  }}
                >
                  <Trans>Cancel</Trans>
                </div>

                <div
                  className="voice-add-confirm"
                  style={{
                    marginRight: "10px",
                    opacity: this.state.isSendingCode ? 0.6 : 1,
                  }}
                  onClick={async () => {
                    if (!this.state.loginConfig.email) {
                      toast.error(this.props.t("Enter your email"));
                      return;
                    }
                    if (this.state.isSendingCode || this.state.countdown) {
                      return;
                    }
                    this.setState({ isSendingCode: true });
                    toast.loading(this.props.t("Sending"), {
                      id: "send-email-code",
                    });
                    let userRequest = await getUserRequest();
                    let response = await userRequest.sendEmailCode({
                      email: this.state.loginConfig.email,
                    });
                    if (response.code === 200) {
                      toast.success(this.props.t("Send successfully"), {
                        id: "send-email-code",
                      });
                      this.setState({ isSendingCode: false });
                      let countdown = 60;
                      let timer = setInterval(() => {
                        countdown--;
                        this.setState({ countdown });
                        if (countdown === 0) {
                          clearInterval(timer);
                        }
                      }, 1000);
                    } else {
                      this.setState({ isSendingCode: false });
                      toast.error(
                        this.props.t("Failed to send code, error code") +
                          ": " +
                          response.msg,
                        { id: "send-email-code" }
                      );
                    }
                  }}
                >
                  {this.state.countdown ? (
                    this.state.countdown + "s"
                  ) : this.state.isSendingCode ? (
                    <Trans>Sending</Trans>
                  ) : (
                    <Trans>Send code</Trans>
                  )}
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: "13px",
                lineHeight: "20px",
                marginTop: "-15px",
                opacity: 0.6,
                color: "rgb(231, 69, 69)",
              }}
            >
              {this.props.t(
                "Due to the limited number of emails we can send each day, to prevent login issues after reaching the sending limit, please make sure to add additional login options as backups after logging in."
              )}
            </div>
            <div
              style={{
                fontSize: "13px",
                lineHeight: "16px",
                opacity: 0.6,
                marginTop: "10px",
              }}
            >
              {this.props.t("Supported email providers")}
              <br />
              {CommonTool.EmailProviders.join(", ")}
            </div>
          </div>
        )}
        <div className="setting-dialog-new-title">
          <Trans>Add login option</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            onChange={this.handleAddLoginOption}
          >
            {[{ label: "Please select", value: "" }, ...loginList]
              .filter((item) => {
                if (this.props.loginOptionList.length > 0) {
                  return !this.props.loginOptionList.includes(item.value);
                } else {
                  return true;
                }
              })
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
        <div className="setting-dialog-new-title">
          <Trans>Delete login option</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            onChange={this.handleDeleteLoginOption}
          >
            {[{ label: "Please select", value: "" }, ...loginList]
              .filter((item) => {
                if (item.value === "") {
                  return true;
                }
                if (this.props.loginOptionList.length > 0) {
                  return this.props.loginOptionList.includes(item.value);
                } else {
                  return false;
                }
              })
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

        {this.props.isAuthed && (
          <div className="setting-dialog-new-title">
            <Trans>Log out</Trans>

            <span
              className="change-location-button"
              onClick={async () => {
                await TokenService.deleteToken("is_authed");
                await TokenService.deleteToken("access_token");
                await TokenService.deleteToken("refresh_token");
                ConfigService.removeItem("defaultSyncOption");
                ConfigService.removeItem("dataSourceList");
                this.props.handleFetchAuthed();
                this.props.handleLoginOptionList([]);
                this.props.handleFetchDataSourceList();
                this.props.handleFetchDefaultSyncOption();
                toast.success(this.props.t("Log out successful"));
              }}
            >
              <Trans>Log out</Trans>
            </span>
          </div>
        )}
        {this.props.isAuthed && (
          <div className="setting-dialog-new-title">
            <Trans>Get device identifier</Trans>

            <span
              className="change-location-button"
              onClick={async () => {
                let fingerPrint = await TokenService.getFingerprint();
                copyTextToClipboard(fingerPrint);
                toast.success(this.props.t("Copied"));
              }}
            >
              <Trans>Copy</Trans>
            </span>
          </div>
        )}
        {this.props.isAuthed && (
          <div className="setting-dialog-new-title">
            <Trans>Get error log</Trans>

            <span
              className="change-location-button"
              onClick={async () => {
                let errorLog = ConfigService.getItem("errorLog") || "";
                if (isElectron) {
                  const { ipcRenderer } = window.require("electron");
                  let log = await ipcRenderer.invoke("get-store-value", {
                    key: "errorLog",
                  });
                  errorLog += log || "";
                }
                copyTextToClipboard(errorLog);
                toast.success(this.props.t("Copied"));
              }}
            >
              <Trans>Copy</Trans>
            </span>
          </div>
        )}
        {this.props.isAuthed && this.props.userInfo && (
          <div className="setting-dialog-new-title">
            <Trans>Account type</Trans>
            <div>
              <Trans>
                {this.props.userInfo.type === "trial"
                  ? "Trial user"
                  : this.props.userInfo.type === "pro"
                  ? "Paid user"
                  : "Free user"}
              </Trans>
              <>
                {" ("}
                <Trans
                  i18nKey="Valid until"
                  label={this.props.userInfo.valid_until}
                >
                  Valid until
                  {{
                    label: formatTimestamp(
                      this.props.userInfo.valid_until * 1000
                    ),
                  }}
                </Trans>
                {")"}
              </>
            </div>
          </div>
        )}
        {this.props.isAuthed && this.props.userInfo && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: 20,
            }}
          >
            <div
              className="new-version-open"
              onClick={async () => {
                let response = await getTempToken();
                if (response.code === 200) {
                  let tempToken = response.data.access_token;
                  let deviceUuid = await TokenService.getFingerprint();
                  openExternalUrl(
                    WEBSITE_URL +
                      (ConfigService.getReaderConfig("lang").startsWith("zh")
                        ? "/zh"
                        : "/en") +
                      "/pricing?temp_token=" +
                      tempToken +
                      "&device_uuid=" +
                      deviceUuid
                  );
                } else if (response.code === 401) {
                  this.props.handleFetchAuthed();
                }
              }}
              style={{
                fontWeight: "bold",
                position: "absolute",
                bottom: "20px",
                paddingLeft: "20px",
                paddingRight: "20px",
              }}
            >
              <Trans>
                {this.props.userInfo.valid_until <
                parseInt(new Date().getTime() / 1000 + "")
                  ? "Upgrade to Pro"
                  : "Renew Pro"}
              </Trans>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default AccountSetting;
