import { useLatest } from "../../utils/hooks/useLatest";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import "./login.css";
import { LoginProps, LoginState } from "./interface";
import { Trans } from "react-i18next";
import { getLoginParamsFromUrl } from "../../utils/file/common";
import toast, { Toaster } from "react-hot-toast";
import { loginList } from "../../constants/loginList";
import {
  generateSyncRecord,
  getServerRegion,
  getWebsiteLang,
  getWebsiteUrl,
  handleAutoCloudSync,
  handleContextMenu,
  openInBrowser,
  removeSearchParams,
} from "../../utils/common";
import {
  CommonTool,
  ConfigService,
  KookitConfig,
  LoginHelper,
} from "../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import { driveList } from "../../constants/driveList";
import {
  getUserRequest,
  loginRegister,
  resetUserRequest,
} from "../../utils/request/user";
import SettingDialog from "../../components/dialogs/settingDialog";
import LoadingDialog from "../../components/dialogs/loadingDialog";
import { resetReaderRequest } from "../../utils/request/reader";
import { resetThirdpartyRequest } from "../../utils/request/thirdparty";
import logoLogin from "../../assets/images/logo-login.png";
import background1 from "../../assets/images/background1.png";
import illustration1 from "../../assets/images/illustration1.png";
import background2 from "../../assets/images/background2.png";
import illustration2 from "../../assets/images/illustration2.png";
import background3 from "../../assets/images/background3.png";
import mobileQrZh from "../../assets/images/mobile-qr-zh.png";
import mobileQr from "../../assets/images/mobile-qr.png";
import { useAppStore } from "../../store/useAppStore";

const Login = (props: LoginProps) => {
  const isSettingOpen = useAppStore((s) => s.manager.isSettingOpen);
  const isShowLoading = useAppStore((s) => s.manager.isShowLoading);
  const isShowSupport = useAppStore((s) => s.manager.isShowSupport);
  const cloudSyncFunc = useAppStore((s) => s.book.cloudSyncFunc);
  const handleLoadingDialog = useAppStore((s) => s.handleLoadingDialog);
  const handleFetchAuthed = useAppStore((s) => s.handleFetchAuthed);
  const handleSetting = useAppStore((s) => s.handleSetting);
  const handleSettingMode = useAppStore((s) => s.handleSettingMode);
  const handleSettingDrive = useAppStore((s) => s.handleSettingDrive);
  const handleFetchDataSourceList = useAppStore(
    (s) => s.handleFetchDataSourceList
  );
  const handleFetchDefaultSyncOption = useAppStore(
    (s) => s.handleFetchDefaultSyncOption
  );
  const handleFetchUserInfo = useAppStore((s) => s.handleFetchUserInfo);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentProps = {
    ...props,
    t,
    isSettingOpen,
    isShowLoading,
    isShowSupport,
    cloudSyncFunc,
    handleLoadingDialog,
    handleFetchAuthed,
    handleSetting,
    handleSettingMode,
    handleSettingDrive,
    handleFetchDataSourceList,
    handleFetchDefaultSyncOption,
    handleFetchUserInfo,
  };
  const propsRef = useLatest(currentProps);
  const [state, setState] = useState<LoginState>({
    currentStep: 0,
    loginConfig: {},
    countdown: 0,
    isSendingCode: false,
    serverRegion: getServerRegion(),
  });
  const stateRef = useLatest(state);
  const updateState = (patch: Partial<LoginState>) =>
    setState((prev) => ({ ...prev, ...patch }));
  const prevPropsRef = useRef(propsRef.current);
  const lastLoginClickTimeRef = useRef<number>(0);

  const handleLogin = async (code: string, service: string) => {
    if (!service || !code) {
      toast.error(
        propsRef.current.t("Missing parameters") + propsRef.current.t("Token")
      );
      return;
    }
    propsRef.current.handleLoadingDialog(true);
    let res = await loginRegister(service, code);
    if (res.code === 200) {
      propsRef.current.handleLoadingDialog(false);
      let result = await handleAutoCloudSync();
      if (result) {
        propsRef.current.cloudSyncFunc();
      } else {
        ConfigService.removeItem("defaultSyncOption");
        ConfigService.removeItem("dataSourceList");
      }

      propsRef.current.handleFetchDataSourceList();
      propsRef.current.handleFetchDefaultSyncOption();
      removeSearchParams();
      propsRef.current.handleFetchAuthed();
      await propsRef.current.handleFetchUserInfo();
      toast.success(propsRef.current.t("Login successful"));
      updateState({ currentStep: result ? 4 : 3 });
      if (ConfigService.getReaderConfig("isProUpgraded") !== "yes") {
        try {
          ConfigService.setReaderConfig("isProUpgraded", "yes");
          await generateSyncRecord();
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      propsRef.current.handleLoadingDialog(false);
      if (service === "email") {
        toast(
          propsRef.current.t("Please make sure the email and code are correct")
        );
      }
      toast.error(
        propsRef.current.t("Login failed, error code") + ": " + res.msg
      );
    }
  };
  const handleServerRegionChange = (region: string) => {
    ConfigService.setItem("serverRegion", region);
    updateState({ serverRegion: region });
    resetReaderRequest();
    resetUserRequest();
    resetThirdpartyRequest();
  };

  useEffect(() => {
    if (isElectron) {
      const ipcRenderer = window.electronAPI;
      ipcRenderer.on("oauth-callback", (config) => {
        let code = config.code;
        let state = config.state;
        updateState({ currentStep: 2 });
        if (state) {
          let { service } = JSON.parse(decodeURIComponent(state.split("|")[1]));
          handleLogin(code, service);
        }
      });
    } else {
      let url = document.location.href;
      if (url.indexOf("code") > -1) {
        let params: any = getLoginParamsFromUrl();
        let code = params.code;
        let state = params.state;
        updateState({ currentStep: 2 });
        if (state) {
          let { service } = JSON.parse(decodeURIComponent(state.split("|")[1]));
          handleLogin(code, service);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const prevProps = prevPropsRef.current;
    prevPropsRef.current = propsRef.current;
    if (
      isShowSupport &&
      isShowSupport !== prevProps.isShowSupport
    ) {
      toast(
        t(
          "Your Pro trial has expired, please renew it to continue using the Pro features"
        )
      );
      navigate("/manager/home");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  return (
    <>
      <Toaster
        toastOptions={{
          style: {
            padding: "8px 10px",
            wordWrap: "break-word",
            wordBreak: "break-word",
            whiteSpace: "normal",
            overflowWrap: "break-word",
          },
        }}
      />
      <div
        className="login-close-container"
        onClick={() => {
          navigate("/manager/home");
        }}
      >
        <span className="icon-close login-close-icon theme-color-delete"></span>
      </div>
      {isSettingOpen && <SettingDialog />}
      {isShowLoading && <LoadingDialog />}
      {state.currentStep === 0 && (
        <div
          className="login-container"
          style={{
            backgroundColor: "#f2ede5",
          }}
        >
          <div
            className="login-cover-container"
            style={{
              backgroundColor: "#e5e2dd",
            }}
          >
            <div className="login-logo">
              <img src={logoLogin} alt="logo" className="login-logo-img" />
            </div>

            <img src={background1} alt="cover" className="login-cover-img" />
          </div>
          <div className="login-content-container">
            <img
              src={illustration1}
              alt="logo"
              className="login-content-illustration"
            />

            <div className="login-title">
              <Trans>
                {t("Meticulously designed and built for Android and iOS")}
              </Trans>
            </div>
            <div className="login-subtitle">
              {t(
                "After three years of design and development, the mobile version of Koodo Reader is finally out"
              )}
            </div>
            <div
              className="login-next-button"
              onClick={() => {
                updateState({
                  currentStep: 1,
                });
              }}
            >
              {t("Next step")}
            </div>
          </div>
        </div>
      )}
      {state.currentStep === 1 && (
        <div
          className="login-container"
          style={{
            backgroundColor: "#dfdedd",
          }}
        >
          <div
            className="login-cover-container"
            style={{
              backgroundColor: "#eae9e5",
            }}
          >
            <div className="login-logo">
              <img src={logoLogin} alt="logo" className="login-logo-img" />
            </div>

            <img src={background2} alt="cover" className="login-cover-img" />
          </div>
          <div className="login-content-container">
            <img
              src={illustration2}
              alt="logo"
              className="login-content-illustration"
              style={{
                width: "45%",
              }}
            />

            <div className="login-title" style={{ marginTop: "20%" }}>
              {t(
                "Synchronize books and reading progress across all your devices"
              )}
            </div>
            <div className="login-subtitle">
              {t(
                "With the integration of popular cloud storage services, WebDAV, FTP, SFTP, SMB, Docker, and object storage, all your data remains securely in your control"
              )}
            </div>
            <div>
              <div
                className="login-next-button"
                onClick={() => {
                  updateState({
                    currentStep: 0,
                  });
                }}
                style={{
                  borderWidth: "0px",
                  right: "140px",
                }}
              >
                {t("Last step")}
              </div>
              <div
                className="login-next-button"
                onClick={() => {
                  updateState({
                    currentStep: 2,
                  });
                }}
              >
                {t("Next step")}
              </div>
            </div>
          </div>
        </div>
      )}
      {state.currentStep === 2 && (
        <div
          className="login-container"
          style={{
            backgroundColor: "#dcd7c7",
          }}
        >
          <div
            className="login-cover-container"
            style={{
              backgroundColor: "#e4e1d8",
            }}
          >
            <div className="login-logo">
              <img src={logoLogin} alt="logo" className="login-logo-img" />
            </div>

            <img src={background3} alt="cover" className="login-cover-img" />
          </div>
          <div className="login-content-container">
            <div
              className="login-title"
              style={{ marginTop: "50px", marginBottom: "30px" }}
            >
              {t(
                "Embark on your journey of exploration with Koodo Reader Pro"
              )}
            </div>
            <div className="login-option-box">
              <div>
                <div className="login-region-container">
                  <div className="login-region-title">
                    {t("Server region")}
                  </div>
                  <div>
                    <span
                      onClick={() => {
                        handleServerRegionChange("global");
                      }}
                      style={
                        state.serverRegion === "global"
                          ? { textDecoration: "underline" }
                          : {}
                      }
                    >
                      {t("Global")}
                    </span>
                    <span>{" | "}</span>
                    <span
                      onClick={() => {
                        handleServerRegionChange("china");
                      }}
                      style={
                        state.serverRegion === "china"
                          ? { textDecoration: "underline" }
                          : {}
                      }
                    >
                      {t("China")}
                    </span>
                  </div>
                </div>
                {loginList.map((item) => {
                  return (
                    <div
                      className="login-option-container"
                      key={item.value}
                      style={{}}
                      onClick={() => {
                        if (item.value === "email") {
                          updateState({ currentStep: 5 });
                          return;
                        }
                        let url = LoginHelper.getAuthUrl(
                          item.value,
                          isElectron ? "desktop" : "browser",
                          getServerRegion() === "china" &&
                            item.value === "microsoft"
                            ? KookitConfig.ThirdpartyConfig.cnCallbackUrl
                            : KookitConfig.ThirdpartyConfig.callbackUrl
                        );
                        if (url) {
                          if (isElectron) {
                            openInBrowser(url);
                          } else {
                            window.location.replace(url);
                          }
                        }
                      }}
                    >
                      <div className="login-option-icon">
                        <span
                          className={item.icon + " login-option-icon"}
                          style={{ fontSize: item.fontsize }}
                        ></span>
                      </div>
                      <div className="login-option-title">
                        <Trans i18nKey="Continue with" label={item.label}>
                          Continue with {{ label: t(item.label) }}
                        </Trans>
                      </div>
                    </div>
                  );
                })}
                <div className="login-billing-info">
                  {t(
                    "7-day free trial upon registration, then billed $4.99 per Year"
                  )}
                </div>
                <div
                  className="login-billing-info"
                  style={{
                    marginTop: "-25px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  onClick={() => {
                    openInBrowser(
                      getWebsiteUrl() + getWebsiteLang() + "/pricing"
                    );
                  }}
                >
                  {t("Compare Free and Pro features")}
                </div>
                <div
                  className="login-manual-token"
                  onClick={() => {
                    handleSetting(true);
                    handleSettingMode("account");
                  }}
                >
                  {t("Manually enter login credentials")}
                </div>
                <div className="login-term">
                  {t(
                    "By clicking continue, you acknowledge that you have carefully read and agree to accept Koodo Reader's Terms of Service and Privacy Policy"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {state.currentStep === 3 && (
        <div
          className="login-container"
          style={{
            backgroundColor: "#dcd7c7",
          }}
        >
          <div
            className="login-cover-container"
            style={{
              backgroundColor: "#e4e1d8",
            }}
          >
            <div className="login-logo">
              <img src={logoLogin} alt="logo" className="login-logo-img" />
            </div>

            <img src={background3} alt="cover" className="login-cover-img" />
          </div>
          <div className="login-content-container">
            <div
              className="login-title"
              style={{ marginTop: "80px", marginBottom: "10%" }}
            >
              {t("Add a data source for data synchronization and backup")}
            </div>
            <div className="login-sync-container">
              {driveList
                .filter((item) => {
                  if (!isElectron) {
                    return item.support.includes("browser");
                  } else {
                    return true;
                  }
                })
                .filter((item) => {
                  if (
                    isElectron &&
                    window.electronAPI?.runtime?.platform !== "darwin"
                  ) {
                    return item.value !== "icloud";
                  }
                  return true;
                })
                .map((item) => {
                  return (
                    <div
                      className="login-sync-box"
                      key={item.value}
                      style={{}}
                      onClick={() => {
                        handleSetting(true);
                        handleSettingMode("sync");
                        handleSettingDrive(item.value);
                      }}
                    >
                      <div className="login-sync-title">
                        {t(item.label)}
                      </div>
                      <div className="login-sync-icon-container">
                        <span className={"icon-add login-sync-icon"}></span>
                      </div>
                      {ConfigService.getReaderConfig("lang") &&
                        ConfigService.getReaderConfig("lang").startsWith(
                          "zh"
                        ) &&
                        item.value === "webdav" &&
                        isElectron && (
                          <div className="login-sync-text">
                            {t("Recommended (use with Nutstore)")}
                          </div>
                        )}
                      {ConfigService.getReaderConfig("lang") &&
                        ConfigService.getReaderConfig("lang").startsWith(
                          "zh"
                        ) &&
                        item.value === "microsoft" && (
                          <div className="login-sync-text">
                            {t("Access may be unstable in China")}
                          </div>
                        )}
                      {ConfigService.getReaderConfig("lang") &&
                        ConfigService.getReaderConfig("lang").startsWith(
                          "zh"
                        ) &&
                        item.value === "yiyiwu" && (
                          <div className="login-sync-text">
                            {t("Only recommended for VIP users")}
                          </div>
                        )}
                      <div className="login-sync-subtitle">
                        <div>
                          {item.support.map((support) => {
                            return (
                              <span
                                key={support}
                                className={
                                  "icon-" + support + " login-sync-support"
                                }
                              ></span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div
              className="login-next-button"
              onClick={() => {
                updateState({
                  currentStep: 4,
                });
              }}
              style={{
                borderWidth: "0px",
                right: "0px",
                // bottom: "10px",
              }}
            >
              {t("Skip")}
            </div>
          </div>
        </div>
      )}
      {state.currentStep === 4 && (
        <div
          className="login-container"
          style={{
            backgroundColor: "#dcd7c7",
          }}
        >
          <div
            className="login-cover-container"
            style={{
              backgroundColor: "#e4e1d8",
            }}
          >
            <div className="login-logo">
              <img src={logoLogin} alt="logo" className="login-logo-img" />
            </div>

            <img src={background3} alt="cover" className="login-cover-img" />
          </div>
          <div className="login-content-container">
            <div
              className="login-title"
              style={{ marginTop: "50px", marginBottom: "20px" }}
            >
              {t(
                "Download the mobile version to read and take notes anytime, anywhere"
              )}
            </div>
            <div className="login-mobile-container">
              <img
                src={
                  ConfigService.getReaderConfig("lang") &&
                  ConfigService.getReaderConfig("lang").startsWith("zh")
                    ? mobileQrZh
                    : mobileQr
                }
                alt="logo"
                className="login-mobile-qr"
                style={{
                  width: "40%",
                }}
              />
            </div>
            <div
              className="login-next-button"
              onClick={() => {
                navigate("/manager/home");
              }}
              style={{
                borderWidth: "0px",
                right: "0px",
              }}
            >
              {t("Finish")}
            </div>
          </div>
        </div>
      )}
      {state.currentStep === 5 && (
        <div
          className="login-container"
          style={{
            backgroundColor: "#dcd7c7",
          }}
        >
          <div
            className="login-cover-container"
            style={{
              backgroundColor: "#e4e1d8",
            }}
          >
            <div className="login-logo">
              <img src={logoLogin} alt="logo" className="login-logo-img" />
            </div>

            <img src={background3} alt="cover" className="login-cover-img" />
          </div>
          <div className="login-content-container">
            <div
              className="login-title"
              style={{ marginTop: "80px", marginBottom: "50px" }}
            >
              {t(
                "Embark on your journey of exploration with Koodo Reader Pro"
              )}
            </div>
            <div className="login-option-box">
              <div>
                <input
                  type={"text"}
                  name={"email"}
                  placeholder={t("Enter your email")}
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
                  onContextMenu={() => {
                    handleContextMenu("token-dialog-email-box", true);
                  }}
                  onBlur={(e) => {
                    const email = e.target.value.trim();
                    if (email) {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (email && !emailRegex.test(email)) {
                        toast.error(t("Invalid email format"));
                        return;
                      }
                    }
                  }}
                  id={"token-dialog-email-box"}
                  className="login-input-container"
                  style={{}}
                />
                <div style={{ position: "relative" }}>
                  <input
                    type={"text"}
                    name={"code"}
                    placeholder={t("Enter code")}
                    onChange={(e) => {
                      if (e.target.value) {
                        setState((prevState) => ({
                          ...prevState,
                          loginConfig: {
                            ...prevState.loginConfig,
                            ["token"]: e.target.value.trim(),
                          },
                        }));
                      }
                    }}
                    onContextMenu={() => {
                      handleContextMenu("token-dialog-token-box", true);
                    }}
                    id={"token-dialog-token-box"}
                    className="login-input-container"
                  />

                  <div
                    className="login-manual-token"
                    onClick={async () => {
                      if (!stateRef.current.loginConfig.email) {
                        toast.error(propsRef.current.t("Enter your email"));
                        return;
                      }
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (
                        !emailRegex.test(stateRef.current.loginConfig.email)
                      ) {
                        toast.error(propsRef.current.t("Invalid email format"));
                        return;
                      }
                      if (
                        stateRef.current.isSendingCode ||
                        stateRef.current.countdown
                      ) {
                        return;
                      }
                      updateState({ isSendingCode: true });
                      toast.loading(propsRef.current.t("Sending"), {
                        id: "send-email-code",
                      });
                      let userRequest = await getUserRequest();
                      let response = await userRequest.sendEmailCode({
                        email: stateRef.current.loginConfig.email,
                        lang: ConfigService.getReaderConfig("lang"),
                      });
                      if (response.code === 200) {
                        toast.success(propsRef.current.t("Send successfully"), {
                          id: "send-email-code",
                        });
                        toast(
                          propsRef.current.t(
                            "If you didn't receive the verification code, please check the spam folder or use another email provider"
                          ),
                          {
                            duration: 6000,
                          }
                        );
                        updateState({ isSendingCode: false });
                        let countdown = 60;
                        let timer = setInterval(() => {
                          countdown--;
                          updateState({ countdown });
                          if (countdown === 0) {
                            clearInterval(timer);
                          }
                        }, 1000);
                      } else {
                        updateState({ isSendingCode: false });
                        toast.error(
                          propsRef.current.t(
                            "Failed to send code, error code"
                          ) +
                            ": " +
                            response.msg,
                          { id: "send-email-code" }
                        );
                      }
                    }}
                    style={{
                      position: "absolute",
                      right: "30px",
                      top: "30px",
                      textAlign: "right",
                      cursor: "pointer",
                      fontSize: "15px",
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

                <div
                  className="login-manual-token"
                  onClick={async () => {
                    if (
                      !stateRef.current.loginConfig.token ||
                      !stateRef.current.loginConfig.email
                    ) {
                      toast.error(
                        propsRef.current.t("Missing parameters") +
                          propsRef.current.t("Token")
                      );
                      return;
                    }
                    const now = Date.now();
                    if (now - lastLoginClickTimeRef.current < 3000) {
                      toast.error(
                        propsRef.current.t(
                          "You are clicking too fast, please try again later"
                        )
                      );
                      return;
                    }
                    lastLoginClickTimeRef.current = now;
                    handleLogin(
                      stateRef.current.loginConfig.email +
                        "#" +
                        stateRef.current.loginConfig.token,
                      "email"
                    );
                  }}
                  style={{
                    margin: "10px",
                  }}
                >
                  {t("Continue")}
                </div>
                <div className="login-term">
                  {t(
                    "7-days free trial only applies to users who registered with recommended email providers. Recommended email providers are as follows"
                  )}
                  <br />
                  {CommonTool.EmailProviders.join(", ")}
                </div>
                <div
                  className="login-next-button"
                  onClick={() => {
                    updateState({
                      currentStep: 2,
                    });
                  }}
                  style={{
                    borderWidth: "0px",
                    right: "0px",
                  }}
                >
                  {t("Back")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
