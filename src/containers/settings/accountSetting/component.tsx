import React, { useEffect, useRef, useState } from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import _ from "underscore";
import toast from "react-hot-toast";
import {
  formatTimestamp,
  getServerRegion,
  getWebsiteLang,
  getWebsiteUrl,
  handleAutoCloudSync,
  handleContextMenu,
  openInBrowser,
  reloadManager,
  vexComfirmAsync,
} from "../../../utils/common";
import {
  CommonTool,
  ConfigService,
  KookitConfig,
  LoginHelper,
} from "../../../assets/lib/kookit-extra-browser.min";
import { loginList, proFeatures } from "../../../constants/loginList";
import {
  getTempToken,
  getUserRequest,
  loginRegister,
  resetUserRequest,
} from "../../../utils/request/user";
import { handleClearToken, handleExitApp } from "../../../utils/request/common";
import copyTextToClipboard from "copy-text-to-clipboard";
import { resetReaderRequest } from "../../../utils/request/reader";
import { resetThirdpartyRequest } from "../../../utils/request/thirdparty";
import TokenService from "../../../utils/storage/tokenService";
declare var window: any;

const AccountSetting = (props: SettingInfoProps) => {
  const [state, setState] = useState<SettingInfoState>({
    settingLogin: "",
    loginConfig: {},
    isRedeemCode: false,
    redeemCode: "",
    isSendingCode: false,
    countdown: 0,
    showLoginOptions: false,
  });

  const lastBindClickTimeRef = useRef<number>(0);
  const countdownTimerRef = useRef<any>(null);
  const prevIsShowSupportRef = useRef<boolean>(props.isShowSupport);

  const setPartialState = (partial: Partial<SettingInfoState>) => {
    setState((prevState) => ({ ...prevState, ...partial }));
  };

  const handleRest = (_bool: boolean) => {
    toast.success(props.t("Change successful"));
  };

  const handleJump = (url: string) => {
    openInBrowser(url);
  };

  const handleSetting = (stateName: string) => {
    const currentValue = (state as any)[stateName];
    setState(
      (prevState) =>
        ({
          ...prevState,
          [stateName]: !(prevState as any)[stateName],
        }) as any
    );
    ConfigService.setReaderConfig(stateName, currentValue ? "no" : "yes");
    handleRest(currentValue);
  };

  const handleLogout = async () => {
    await handleClearToken();

    props.handleFetchAuthed();
    props.handleLoginOptionList([]);
    props.handleFetchDataSourceList();
    props.handleFetchDefaultSyncOption();
    toast.success(props.t("Log out successful"));
  };

  const handleAddLoginOption = (value: string) => {
    if (!value) {
      return;
    }
    setPartialState({ settingLogin: value });
    if (value !== "email") {
      let url = LoginHelper.getAuthUrl(
        value,
        "manual",
        getServerRegion() === "china" && value === "microsoft"
          ? KookitConfig.ThirdpartyConfig.cnCallbackUrl
          : KookitConfig.ThirdpartyConfig.callbackUrl
      );
      handleJump(url);
    }
  };

  const handleDeleteLoginOption = async (targetValue: string) => {
    if (!targetValue) {
      return;
    }
    if (props.loginOptionList.length === 1) {
      toast.error(props.t("At least one login option should be kept"));
      return;
    }
    toast.loading(props.t("Removing"), {
      id: "remove-login-option",
    });
    let userRequest = await getUserRequest();
    let response = await userRequest.removeLogin({
      provider: targetValue,
    });
    if (response.code === 200) {
      toast.success(props.t("Removal successful"), {
        id: "remove-login-option",
      });
      props.handleFetchLoginOptionList();
    } else if (response.code === 401) {
      toast.error(props.t("Removal failed, error code") + ": " + response.msg, {
        id: "remove-login-option",
      });
      handleExitApp();
      return;
    } else {
      toast.error(props.t("Removal failed, error code") + ": " + response.msg, {
        id: "remove-login-option",
      });
    }
  };

  const handleCancelLoginOption = async () => {
    setPartialState({ settingLogin: "" });
  };

  const handleConfirmLoginOption = async () => {
    if (!state.loginConfig.token || !state.settingLogin) {
      toast.error(props.t("Missing parameters") + props.t("Token"));
      return;
    }
    const now = Date.now();
    if (now - lastBindClickTimeRef.current < 3000) {
      toast.error(props.t("You are clicking too fast, please try again later"));
      return;
    }
    lastBindClickTimeRef.current = now;
    toast.loading(props.t("Adding"), {
      id: "adding",
    });
    let userRequest = await getUserRequest();
    let res = await userRequest.addLogin({
      code: state.loginConfig.token,
      provider: state.settingLogin,
      scope:
        KookitConfig.LoginAuthRequest[state.settingLogin].extraParams.scope,
      redirect_uri:
        getServerRegion() === "china" && state.settingLogin === "microsoft"
          ? KookitConfig.ThirdpartyConfig.cnCallbackUrl
          : KookitConfig.ThirdpartyConfig.callbackUrl,
    });

    if (res.code === 200) {
      props.handleFetchLoginOptionList();
      toast.success(props.t("Addition successful"), {
        id: "adding",
      });
      setPartialState({ settingLogin: "" });
    } else {
      if (state.settingLogin === "email") {
        toast(props.t("Please make sure the email and code are correct"));
      }
      toast.error(props.t("Login failed, error code") + ": " + res.msg, {
        id: "adding",
      });
    }
  };

  const handleLoginRegister = async () => {
    if (!state.loginConfig.token || !state.settingLogin) {
      toast.error(props.t("Missing parameters") + props.t("Token"));
      return;
    }
    const now = Date.now();
    if (now - lastBindClickTimeRef.current < 3000) {
      toast.error(props.t("You are clicking too fast, please try again later"));
      return;
    }
    lastBindClickTimeRef.current = now;
    toast.loading(props.t("Logging in"), {
      id: "bind-login-option",
    });
    let res = await loginRegister(state.settingLogin, state.loginConfig.token);

    if (res.code === 200) {
      props.handleFetchAuthed();
      props.handleFetchLoginOptionList();
      let result = await handleAutoCloudSync();
      if (result) {
        props.cloudSyncFunc();
      } else {
        ConfigService.removeItem("defaultSyncOption");
        ConfigService.removeItem("dataSourceList");
      }
      toast.success(props.t("Login successful"), {
        id: "bind-login-option",
      });
      props.handleFetchDataSourceList();
      props.handleFetchDefaultSyncOption();
      props.handleFetchUserInfo();
      setPartialState({ settingLogin: "" });
    } else {
      if (state.settingLogin === "email") {
        toast(props.t("Please make sure the email and code are correct"));
      }
      toast.error(props.t("Login failed, error code") + ": " + res.msg, {
        id: "bind-login-option",
      });
    }
  };

  useEffect(() => {
    if (props.isAuthed) {
      props.handleFetchLoginOptionList();
      props.handleFetchUserInfo();
    }
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const wasShowSupport = prevIsShowSupportRef.current;
    prevIsShowSupportRef.current = props.isShowSupport;
    if (props.isShowSupport && !wasShowSupport) {
      toast(
        props.t(
          "Your Pro trial has expired, please renew it to continue using the Pro features"
        )
      );
      props.handleSetting(false);
      props.handleSettingMode("general");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isShowSupport]);

  return (
    <>
      {(state.settingLogin === "google" ||
        state.settingLogin === "microsoft" ||
        state.settingLogin === "github") && (
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
            placeholder={props.t(
              "Please click the authorize button below to authorize your account, enter the obtained credentials here, and then click the bind button below"
            )}
            onContextMenu={() => {
              handleContextMenu("token-dialog-token-box");
            }}
            onChange={(e) => {
              if (e.target.value) {
                setState((prevState) => ({
                  ...prevState,
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
                if (props.isAuthed) {
                  handleConfirmLoginOption();
                  return;
                }
                handleLoginRegister();
              }}
            >
              <Trans>Bind</Trans>
            </div>
            <div className="voice-add-button-container">
              <div
                className="voice-add-cancel"
                onClick={() => {
                  handleCancelLoginOption();
                }}
              >
                <Trans>Cancel</Trans>
              </div>

              <div
                className="voice-add-confirm"
                style={{ marginRight: "10px" }}
                onClick={() => {
                  let url = LoginHelper.getAuthUrl(
                    state.settingLogin,
                    "manual",
                    getServerRegion() === "china" &&
                      state.settingLogin === "microsoft"
                      ? KookitConfig.ThirdpartyConfig.cnCallbackUrl
                      : KookitConfig.ThirdpartyConfig.callbackUrl
                  );
                  handleJump(url);
                }}
              >
                <Trans>Authorize</Trans>
              </div>
            </div>
          </div>
        </div>
      )}
      {state.settingLogin === "email" && (
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
            placeholder={props.t("Enter your email")}
            onChange={(e) => {
              if (e.target.value) {
                setState((prevState) => ({
                  ...prevState,
                  loginConfig: {
                    ...prevState.loginConfig,
                    ["email"]: e.target.value.trim(),
                  },
                }));
              }
            }}
            onBlur={(e) => {
              const email = e.target.value.trim();
              if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (email && !emailRegex.test(email)) {
                  toast.error(props.t("Invalid email format"));
                  return;
                }
                // clear code and token if email changed
                setState((prevState) => ({
                  ...prevState,
                  loginConfig: {
                    ...prevState.loginConfig,
                    ["token"]: "",
                  },
                }));
                //empty code box
                const codeBox = document.getElementById(
                  "token-dialog-code-box"
                ) as HTMLInputElement;
                if (codeBox) {
                  codeBox.value = "";
                }
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
            placeholder={props.t("Enter code")}
            onChange={(e) => {
              if (e.target.value) {
                setState((prevState) => ({
                  ...prevState,
                  loginConfig: {
                    ...prevState.loginConfig,
                    ["token"]:
                      state.loginConfig.email + "#" + e.target.value.trim(),
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
                if (props.isAuthed) {
                  handleConfirmLoginOption();
                  return;
                }
                handleLoginRegister();
              }}
            >
              <Trans>Bind</Trans>
            </div>
            <div className="voice-add-button-container">
              <div
                className="voice-add-cancel"
                onClick={() => {
                  handleCancelLoginOption();
                }}
              >
                <Trans>Cancel</Trans>
              </div>

              <div
                className="voice-add-confirm"
                style={{
                  marginRight: "10px",
                  opacity: state.isSendingCode || state.countdown ? 0.6 : 1,
                }}
                onClick={async () => {
                  if (!state.loginConfig.email) {
                    toast.error(props.t("Enter your email"));
                    return;
                  }
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(state.loginConfig.email)) {
                    toast.error(props.t("Invalid email format"));
                    return;
                  }
                  if (state.isSendingCode || state.countdown) {
                    return;
                  }
                  setPartialState({ isSendingCode: true });
                  toast.loading(props.t("Sending"), {
                    id: "send-email-code",
                  });
                  let userRequest = await getUserRequest();
                  let response = await userRequest.sendEmailCode({
                    email: state.loginConfig.email,
                    lang: ConfigService.getReaderConfig("lang"),
                  });
                  if (response.code === 200) {
                    toast.success(props.t("Send successfully"), {
                      id: "send-email-code",
                    });
                    toast(
                      props.t(
                        "If you didn't receive the verification code, please check the spam folder or use another email provider"
                      ),
                      {
                        duration: 6000,
                      }
                    );
                    setPartialState({ isSendingCode: false });
                    let countdown = 60;
                    countdownTimerRef.current = setInterval(() => {
                      countdown--;
                      setPartialState({ countdown });
                      if (countdown === 0) {
                        clearInterval(countdownTimerRef.current);
                        countdownTimerRef.current = null;
                      }
                    }, 1000);
                  } else {
                    setPartialState({ isSendingCode: false });
                    toast.error(
                      props.t("Failed to send code, error code") +
                        ": " +
                        response.msg,
                      { id: "send-email-code" }
                    );
                  }
                }}
              >
                {state.countdown ? (
                  state.countdown + "s"
                ) : state.isSendingCode ? (
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
              lineHeight: "16px",
              opacity: 0.6,
              marginTop: "10px",
            }}
          >
            {props.t(
              "7-days free trial only applies to users who registered with recommended email providers. Recommended email providers are as follows"
            )}
            <br />
            {CommonTool.EmailProviders.join(", ")}
          </div>
        </div>
      )}
      {state.isRedeemCode && (
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
            placeholder={props.t("Enter your redemption code")}
            onChange={(e) => {
              if (e.target.value) {
                setPartialState({
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
                toast.loading(props.t("Verifying..."), {
                  id: "redeem-code",
                });
                let userRequest = await getUserRequest();
                let response = await userRequest.redeemCode({
                  code: state.redeemCode,
                });
                if (response.code === 200) {
                  props.handleFetchUserInfo();
                  toast.success(props.t("Redeem successful"), {
                    id: "redeem-code",
                  });

                  setPartialState({ isRedeemCode: false });
                } else if (response.code === 401) {
                  toast.error(
                    props.t("Redeem failed, error code") + ": " + response.msg,
                    {
                      id: "redeem-code",
                    }
                  );
                  handleExitApp();
                  return;
                } else if (response.code === 10010) {
                  toast.error(
                    props.t(
                      "This code has already been used, if you have redeemed it before, there is no need to redeem it again. Just log in to same account to use Pro features"
                    ),
                    {
                      id: "redeem-code",
                      duration: 6000,
                    }
                  );
                } else {
                  toast.error(
                    props.t("Redeem failed, error code") + ": " + response.msg,
                    {
                      id: "redeem-code",
                    }
                  );
                  if (response.code === 10009) {
                    if (state.redeemCode.startsWith("CD")) {
                      toast(
                        props.t(
                          "This is the order number not the redemption code, please check your email again, the redemption code is below the order number"
                        ),
                        {
                          duration: 8000,
                        }
                      );
                    } else {
                      toast(
                        props.t(
                          "Please make sure you entered the correct redemption code and the code matches your server region, if you have any questions, please contact our support team"
                        ),
                        {
                          duration: 8000,
                        }
                      );
                    }
                  }
                }
              }}
            >
              <Trans>Redeem</Trans>
            </div>
            <div className="voice-add-button-container">
              <div
                className="voice-add-cancel"
                onClick={() => {
                  setPartialState({ isRedeemCode: false });
                }}
              >
                <Trans>Cancel</Trans>
              </div>
            </div>
          </div>
        </div>
      )}
      {!props.isAuthed && !state.showLoginOptions && (
        <div className="pro-banner-container">
          <div className="pro-banner">
            <div className="pro-banner-overlay"></div>
            <div className="pro-banner-content">
              <div className="pro-banner-header">
                <div className="pro-banner-title">
                  <Trans>Pro version</Trans>
                </div>
                <div className="pro-banner-tabs">
                  {(
                    [
                      { key: "yearly", label: "Yearly" },
                      { key: "limited", label: "Limited offer" },
                    ] as const
                  ).map((item) => (
                    <div
                      key={item.key}
                      className={
                        item.key === "yearly"
                          ? "pro-banner-tab active-pro-banner-tab"
                          : "pro-banner-tab"
                      }
                    >
                      <Trans>{item.label}</Trans>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pro-banner-price">
                <span className="pro-banner-price-value">
                  <Trans>{"$4.99"}</Trans>
                </span>
                <span className="pro-banner-price-unit">
                  {" / "}
                  <Trans>{"Year"}</Trans>
                </span>
              </div>
              <div className="pro-banner-features">
                {proFeatures.map((item) => (
                  <div key={item} className="pro-banner-feature-item">
                    <span className="icon-check pro-banner-feature-icon"></span>
                    <span>
                      <Trans>{item}</Trans>
                    </span>
                  </div>
                ))}
              </div>
              <div className="pro-banner-actions">
                <div
                  className="pro-banner-btn pro-banner-btn-login"
                  onClick={() => {
                    setPartialState({ showLoginOptions: true });
                  }}
                >
                  <Trans>Register / Login</Trans>
                </div>
                <div
                  className="pro-banner-btn pro-banner-btn-trial"
                  onClick={() => {
                    setPartialState({ showLoginOptions: true });
                  }}
                >
                  <Trans>Start 7-day free trial</Trans>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {(props.isAuthed || state.showLoginOptions) && (
        <div className="setting-dialog-new-title">
          <div>
            <Trans>
              {props.isAuthed ? "Server region" : "Select server region"}
            </Trans>
            {ConfigService.getReaderConfig("lang").startsWith("zh") && (
              <span
                style={{
                  textDecoration: "underline",
                  marginLeft: "10px",
                  cursor: "pointer",
                  opacity: 0.7,
                  fontSize: "13px",
                  lineHeight: "16px",
                }}
                onClick={() => {
                  openInBrowser(
                    getWebsiteUrl() + getWebsiteLang() + "/server-region"
                  );
                }}
              >
                <Trans>Learn more</Trans>
              </span>
            )}
          </div>
          {props.isAuthed ? (
            <div
              className="lang-setting-option"
              style={{ display: "flex", alignItems: "center" }}
            >
              <Trans>
                {getServerRegion() === "china" ? "China" : "Global"}
              </Trans>
              <span
                className="change-location-button"
                style={{ marginLeft: "10px" }}
                onClick={async () => {
                  let result = await vexComfirmAsync(
                    "We have two server regions(Global and China). To change the server region, you need to log out first. Do you want to log out now?"
                  );
                  if (result) {
                    let newRegion =
                      getServerRegion() === "china" ? "global" : "china";
                    ConfigService.setItem("serverRegion", newRegion);
                    resetReaderRequest();
                    resetUserRequest();
                    resetThirdpartyRequest();
                    await handleLogout();
                  }
                }}
              >
                <Trans>Change</Trans>
              </span>
            </div>
          ) : (
            <select
              name=""
              className="lang-setting-dropdown"
              value={getServerRegion()}
              onChange={(event) => {
                if (!event.target.value) {
                  return;
                }
                ConfigService.setItem("serverRegion", event.target.value);
                resetReaderRequest();
                resetUserRequest();
                resetThirdpartyRequest();
                toast.success(props.t("Setup successful"));
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
                >
                  {props.t(item.label)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      {!props.isAuthed && state.showLoginOptions && (
        <>
          <div className="setting-dialog-new-title">
            <Trans>Select login method</Trans>
          </div>
          <div className="account-login-grid">
            {loginList.map((item) => {
              return (
                <div
                  className="account-login-option"
                  key={item.value}
                  onClick={() => {
                    handleAddLoginOption(item.value);
                  }}
                >
                  <span
                    className={item.icon + " account-login-option-icon"}
                    style={{ fontSize: item.fontsize }}
                  ></span>
                  <span className="account-login-option-label">
                    {props.t(item.label)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
      {!props.isAuthed && state.showLoginOptions && (
        <>
          <div
            className="account-login-tips"
            style={{
              opacity: 1,
            }}
          >
            {props.t(
              "7-day free trial upon registration, then billed $4.99 per Year"
            )}
          </div>
          <div
            className="account-login-tips"
            onClick={() => {
              openInBrowser(getWebsiteUrl() + getWebsiteLang() + "/pricing");
            }}
            style={{
              marginTop: "10px",
              fontWeight: "bold",
              cursor: "pointer",
              textDecoration: "underline",
              opacity: 1,
            }}
          >
            {props.t("Compare Free and Pro features")}
          </div>
        </>
      )}
      {props.isAuthed &&
        loginList.map((login) => (
          <div className="setting-dialog-new-title" key={login.value}>
            <Trans>{props.t(login.label)}</Trans>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => {
                if (
                  !props.loginOptionList.find(
                    (item) => item.provider === login.value
                  )
                ) {
                  handleAddLoginOption(login.value);
                }
              }}
            >
              <div>
                {props.loginOptionList.find(
                  (item) => item.provider === login.value
                ) ? (
                  props.loginOptionList.find(
                    (item) => item.provider === login.value
                  )?.email ? (
                    <span>
                      {
                        props.loginOptionList.find(
                          (item) => item.provider === login.value
                        )?.email
                      }
                    </span>
                  ) : (
                    <span>{props.t("Bound")}</span>
                  )
                ) : (
                  <span style={{ opacity: 0.4 }}>{props.t("Not bound")}</span>
                )}
              </div>
              {props.loginOptionList.find(
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
                    handleDeleteLoginOption(login.value);
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

      {props.isAuthed && (
        <div className="setting-dialog-new-title">
          <Trans>Log out</Trans>

          <span
            className="change-location-button"
            onClick={async () => {
              await handleLogout();
              reloadManager();
            }}
          >
            <Trans>Log out</Trans>
          </span>
        </div>
      )}
      {props.isAuthed && (
        <div className="setting-dialog-new-title">
          <Trans>Get device identifier</Trans>

          <span
            className="change-location-button"
            onClick={async () => {
              let fingerPrint = await TokenService.getFingerprint();
              copyTextToClipboard(fingerPrint);
              toast.success(props.t("Copied"));
            }}
          >
            <Trans>Copy</Trans>
          </span>
        </div>
      )}
      {props.isAuthed && (
        <div className="setting-dialog-new-title">
          <Trans>Delete account</Trans>

          <span
            className="change-location-button"
            onClick={async () => {
              vexComfirmAsync(
                props.t(
                  "To delete your account, you need to use the mobile app. After logging in, go to Settings → Account, and follow the instructions."
                )
              );
            }}
          >
            <Trans>How to</Trans>
          </span>
        </div>
      )}
      {props.isAuthed && props.userInfo && (
        <div className="setting-dialog-new-title">
          <Trans>AI voice character quota</Trans>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span>
              {props.userInfo.type === "trial"
                ? props.t("Trial quota")
                : (props.userInfo && props.userInfo.free_credits
                    ? props.userInfo.free_credits
                    : 0) +
                  (props.userInfo &&
                  props.userInfo.tts_credits &&
                  props.userInfo.tts_credits > 0
                    ? " + " + props.userInfo.tts_credits
                    : "")}
            </span>
            <span
              className="change-location-button"
              style={{ marginLeft: "10px", cursor: "pointer" }}
              onClick={async () => {
                toast.loading(props.t("Refreshing"), {
                  id: "refresh-user-info",
                });
                await props.handleFetchUserInfo();
                toast.success(props.t("Refresh successful"), {
                  id: "refresh-user-info",
                });
              }}
            >
              <Trans>Refresh</Trans>
            </span>
          </div>
        </div>
      )}
      {props.isAuthed && (
        <p className="setting-option-subtitle">
          {props.t(
            "Once the daily free quota is exhausted, the system will begin deducting from your purchased quota. The character count is calculated as follows, each letter, and punctuation mark counts as one character."
          )}
        </p>
      )}
      {props.isAuthed && props.userInfo && (
        <div className="setting-dialog-new-title">
          <Trans>Account type</Trans>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span>
              <Trans>
                {props.userInfo.type === "trial"
                  ? "Trial user"
                  : props.userInfo.type === "pro"
                    ? "Pro user"
                    : "Free user"}
              </Trans>
              {" ("}
              <Trans i18nKey="Valid until" label={props.userInfo.valid_until}>
                Valid until
                {{
                  label: formatTimestamp(props.userInfo.valid_until * 1000),
                }}
              </Trans>
              {")"}
            </span>
            <span
              className="change-location-button"
              style={{ marginLeft: "10px", cursor: "pointer" }}
              onClick={async () => {
                toast.loading(props.t("Refreshing"), {
                  id: "refresh-user-info",
                });
                await props.handleFetchUserInfo();
                toast.success(props.t("Refresh successful"), {
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
            if (!props.isAuthed) {
              openInBrowser(getWebsiteUrl() + getWebsiteLang() + "/pricing");
              return;
            }
            let response = await getTempToken();
            if (response.code === 200) {
              let tempToken = response.data.access_token;
              let deviceUuid = await TokenService.getFingerprint();
              openInBrowser(
                getWebsiteUrl() +
                  getWebsiteLang() +
                  "/pricing?temp_token=" +
                  tempToken +
                  "&device_uuid=" +
                  deviceUuid
              );
            } else if (response.code === 401) {
              props.handleFetchAuthed();
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
            {props.isAuthed && props.userInfo
              ? props.userInfo.valid_until <
                parseInt(new Date().getTime() / 1000 + "")
                ? "Upgrade to Pro"
                : "Renew Pro"
              : "Upgrade to Pro"}
          </Trans>
        </div>
        <div
          onClick={async () => {
            if (!props.isAuthed) {
              toast(props.t("Please log in first"));
              return;
            }
            setPartialState({ isRedeemCode: true });
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
};

export default AccountSetting;
