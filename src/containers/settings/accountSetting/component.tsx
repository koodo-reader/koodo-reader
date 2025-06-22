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
  reloadManager,
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
  resetUserRequest,
} from "../../../utils/request/user";
import { handleExitApp } from "../../../utils/request/common";
import copyTextToClipboard from "copy-text-to-clipboard";
import { resetReaderRequest } from "../../../utils/request/reader";
import { resetThirdpartyRequest } from "../../../utils/request/thirdparty";
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
      isRedeemCode: false,
      redeemCode: "",
      isSendingCode: false,
      countdown: 0,
      serverRegion: ConfigService.getItem("serverRegion") || "global",
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
    if (event.target.value !== "email") {
      let url = LoginHelper.getAuthUrl(event.target.value, "manual");
      this.handleJump(url);
    }
  };
  handleDeleteLoginOption = async (event: any) => {
    if (!event.target.value) {
      return;
    }
    if (this.props.loginOptionList.length === 1) {
      toast.error(this.props.t("At least one login option should be kept"));
      return;
    }
    toast.loading(this.props.t("Removing"), {
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
    if (!this.state.loginConfig.token || !this.state.settingLogin) {
      toast.error(this.props.t("Missing parameters") + this.props.t("Token"));
      return;
    }
    toast.loading(this.props.t("Logging in"), {
      id: "bind-login-option",
    });
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
      toast.success(this.props.t("Login successful"), {
        id: "bind-login-option",
      });
      this.props.handleFetchAuthed();
      this.props.handleFetchLoginOptionList();
      ConfigService.removeItem("defaultSyncOption");
      ConfigService.removeItem("dataSourceList");
      this.props.handleFetchDataSourceList();
      this.props.handleFetchDefaultSyncOption();
      this.props.handleFetchUserInfo();
      this.setState({ settingLogin: "" });
    } else {
      if (this.state.settingLogin === "email") {
        toast(this.props.t("Please make sure the email and code are correct"));
      }
      toast.error(this.props.t("Login failed, error code") + ": " + res.msg, {
        id: "bind-login-option",
      });
    }
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
                "Please click the authorize button below to authorize your account, enter the obtained credentials here, and then click the bind button below"
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
                handleContextMenu("token-dialog-code-box", true);
              }}
              id={"token-dialog-code-box"}
              className="token-dialog-username-box"
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
                    opacity:
                      this.state.isSendingCode || this.state.countdown
                        ? 0.6
                        : 1,
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
                      lang: ConfigService.getReaderConfig("lang"),
                    });
                    if (response.code === 200) {
                      toast.success(this.props.t("Send successfully"), {
                        id: "send-email-code",
                      });
                      toast(
                        this.props.t(
                          "If you didn't receive the verification code, please check the spam folder or use another email provider"
                        ),
                        {
                          duration: 6000,
                        }
                      );
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
            {/* <div
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
            </div> */}
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
        {this.state.isRedeemCode && (
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
              name={"redeemCode"}
              placeholder={this.props.t("Enter your redemption code")}
              onChange={(e) => {
                if (e.target.value) {
                  this.setState({
                    redeemCode: e.target.value.trim().toUpperCase(),
                  });
                }
              }}
              onContextMenu={() => {
                handleContextMenu("token-dialog-redeem-code-box", true);
              }}
              id={"token-dialog-redeem-code-box"}
              className="token-dialog-username-box"
              style={{ height: "35px" }}
            />
            <div className="token-dialog-button-container">
              <div
                className="voice-add-confirm"
                onClick={async () => {
                  toast.loading(this.props.t("Verifying..."), {
                    id: "redeem-code",
                  });
                  let userRequest = await getUserRequest();
                  let response = await userRequest.redeemCode({
                    code: this.state.redeemCode,
                  });
                  if (response.code === 200) {
                    this.props.handleFetchUserInfo();
                    let userRequest = await getUserRequest();
                    await userRequest.refreshUserToken();
                    toast.success(this.props.t("Redeem successful"), {
                      id: "redeem-code",
                    });

                    this.setState({ isRedeemCode: false });
                  } else if (response.code === 401) {
                    toast.error(
                      this.props.t("Redeem failed, error code") +
                        ": " +
                        response.msg,
                      {
                        id: "redeem-code",
                      }
                    );
                    handleExitApp();
                    return;
                  } else {
                    toast.error(
                      this.props.t("Redeem failed, error code") +
                        ": " +
                        response.msg,
                      {
                        id: "redeem-code",
                      }
                    );
                  }
                }}
              >
                <Trans>Redeem</Trans>
              </div>
              <div className="voice-add-button-container">
                <div
                  className="voice-add-cancel"
                  onClick={() => {
                    this.setState({ isRedeemCode: false });
                  }}
                >
                  <Trans>Cancel</Trans>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="setting-dialog-new-title">
          <Trans>Select server region</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            onChange={(event) => {
              if (!event.target.value) {
                return;
              }
              if (event.target.value === "china") {
                toast(
                  this.props.t(
                    "Some login options and data sources are not available in your selected server region"
                  )
                );
              }
              ConfigService.setItem("serverRegion", event.target.value);
              this.setState({
                serverRegion: event.target.value,
              });
              resetReaderRequest();
              resetUserRequest();
              resetThirdpartyRequest();
              toast.success(this.props.t("Setup successful"));
            }}
          >
            {[
              { value: "", label: "Please select" },
              { value: "global", label: "Global" },
              { value: "china", label: "China" },
            ].map((item) => (
              <option
                value={item.value}
                key={item.value}
                className="lang-setting-option"
                selected={
                  item.value ===
                  (ConfigService.getItem("serverRegion") || "global")
                }
              >
                {this.props.t(item.label)}
              </option>
            ))}
          </select>
        </div>
        {!this.props.isAuthed && (
          <div className="setting-dialog-new-title">
            <Trans>Select login method</Trans>
            <select
              name=""
              className="lang-setting-dropdown"
              onChange={this.handleAddLoginOption}
            >
              {[
                { label: "Please select", value: "" },
                ...loginList.filter((item) => {
                  if (ConfigService.getItem("serverRegion") === "china") {
                    return item.isCNAvailable;
                  }
                  return true;
                }),
              ].map((item) => (
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
        )}
        {this.props.isAuthed &&
          loginList
            .filter((item) => {
              if (this.state.serverRegion === "china") {
                return item.isCNAvailable;
              }
              return true;
            })
            .map((login) => (
              <div className="setting-dialog-new-title" key={login.value}>
                <Trans>{this.props.t(login.label)}</Trans>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (
                      !this.props.loginOptionList.find(
                        (item) => item.provider === login.value
                      )
                    ) {
                      this.handleAddLoginOption({
                        target: { value: login.value },
                      });
                    }
                  }}
                >
                  <div>
                    {this.props.loginOptionList.find(
                      (item) => item.provider === login.value
                    ) ? (
                      this.props.loginOptionList.find(
                        (item) => item.provider === login.value
                      )?.email ? (
                        <span>
                          {
                            this.props.loginOptionList.find(
                              (item) => item.provider === login.value
                            )?.email
                          }
                        </span>
                      ) : (
                        <span>{this.props.t("Bound")}</span>
                      )
                    ) : (
                      <span style={{ opacity: 0.4 }}>
                        {this.props.t("Not bound")}
                      </span>
                    )}
                  </div>
                  {this.props.loginOptionList.find(
                    (item) => item.provider === login.value
                  ) ? (
                    <span
                      className="icon-trash"
                      style={{
                        fontSize: 13,
                        opacity: 0.8,
                        marginLeft: "10px",
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        this.handleDeleteLoginOption({
                          target: { value: login.value },
                        });
                      }}
                    ></span>
                  ) : (
                    <span
                      className="icon-dropdown"
                      style={{
                        fontSize: 13,
                        opacity: 0.8,
                        transform: "rotate(-90deg)",
                        marginLeft: "10px",
                      }}
                    ></span>
                  )}
                </div>
              </div>
            ))}

        {this.props.isAuthed && (
          <div className="setting-dialog-new-title">
            <Trans>Log out</Trans>

            <span
              className="change-location-button"
              onClick={async () => {
                await TokenService.deleteToken("is_authed");
                await TokenService.deleteToken("access_token");
                await TokenService.deleteToken("refresh_token");

                this.props.handleFetchAuthed();
                this.props.handleLoginOptionList([]);
                ConfigService.removeItem("defaultSyncOption");
                ConfigService.removeItem("dataSourceList");
                this.props.handleFetchDataSourceList();
                this.props.handleFetchDefaultSyncOption();
                toast.success(this.props.t("Log out successful"));
                reloadManager();
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
            <div style={{ display: "flex", alignItems: "center" }}>
              <span>
                <Trans>
                  {this.props.userInfo.type === "trial"
                    ? "Trial user"
                    : this.props.userInfo.type === "pro"
                    ? "Pro user"
                    : "Free user"}
                </Trans>
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
              </span>
              <span
                className="change-location-button"
                style={{ marginLeft: "10px", cursor: "pointer" }}
                onClick={async () => {
                  toast.loading(this.props.t("Refreshing"), {
                    id: "refresh-user-info",
                  });
                  await this.props.handleFetchUserInfo();
                  toast.success(this.props.t("Refresh successful"), {
                    id: "refresh-user-info",
                  });
                }}
              >
                <Trans>Refresh</Trans>
              </span>
            </div>
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            right: "0",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingRight: "10px",
            width: "100%",
            height: "40px",
            zIndex: 100,
          }}
          className="setting-dialog-pro-button"
        >
          <div
            onClick={async () => {
              if (!this.props.isAuthed) {
                openExternalUrl(
                  WEBSITE_URL +
                    (ConfigService.getReaderConfig("lang").startsWith("zh")
                      ? "/zh"
                      : "/en") +
                    "/pricing"
                );
                return;
              }
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
              paddingLeft: "10px",
              paddingRight: "10px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            <Trans>
              {this.props.isAuthed && this.props.userInfo
                ? this.props.userInfo.valid_until <
                  parseInt(new Date().getTime() / 1000 + "")
                  ? "Upgrade to Pro"
                  : "Renew Pro"
                : "Upgrade to Pro"}
            </Trans>
          </div>
          <div
            onClick={async () => {
              if (!this.props.isAuthed) {
                toast(this.props.t("Please log in first"));
                return;
              }
              this.setState({ isRedeemCode: true });
            }}
            style={{
              fontWeight: "bold",
              paddingLeft: "10px",
              paddingRight: "10px",
              cursor: "pointer",
            }}
          >
            <Trans>{"Redeem with code"}</Trans>
          </div>
        </div>
      </>
    );
  }
}

export default AccountSetting;
