import React from "react";
import { LoginProps, LoginState } from "./interface";
import { Trans } from "react-i18next";
import { getLoginParamsFromUrl, upgradePro } from "../../utils/file/common";
import { withRouter } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { loginList } from "../../constants/loginList";
import {
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

class Login extends React.Component<LoginProps, LoginState> {
  constructor(props: LoginProps) {
    super(props);
    this.state = {
      currentStep: 0,
      loginConfig: {},
      countdown: 0,
      isSendingCode: false,
      serverRegion: ConfigService.getItem("serverRegion") || "global",
    };
  }

  componentDidMount() {
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.on("oauth-callback", (_event, config) => {
        let code = config.code;
        let state = config.state;
        this.setState({ currentStep: 2 });
        if (state) {
          let { service } = JSON.parse(decodeURIComponent(state.split("|")[1]));
          this.handleLogin(code, service);
        }
      });
    } else {
      let url = document.location.href;
      if (url.indexOf("code") > -1) {
        let params: any = getLoginParamsFromUrl();
        let code = params.code;
        let state = params.state;
        this.setState({ currentStep: 2 });
        if (state) {
          let { service } = JSON.parse(decodeURIComponent(state.split("|")[1]));
          this.handleLogin(code, service);
        }
      }
    }
  }
  UNSAFE_componentWillReceiveProps(
    nextProps: Readonly<LoginProps>,
    nextContext: any
  ): void {
    if (
      nextProps.isShowSupport &&
      nextProps.isShowSupport !== this.props.isShowSupport
    ) {
      toast(
        this.props.t(
          "Your Pro trial has expired, please renew it to continue using the Pro features"
        )
      );
    }
  }
  handleLogin = async (code: string, service: string) => {
    this.props.handleLoadingDialog(true);
    let res = await loginRegister(service, code);
    if (res.code === 200) {
      this.props.handleLoadingDialog(false);
      toast.success(this.props.t("Login successful"));
      ConfigService.removeItem("defaultSyncOption");
      ConfigService.removeItem("dataSourceList");
      this.props.handleFetchDataSourceList();
      this.props.handleFetchDefaultSyncOption();
      removeSearchParams();
      this.props.handleFetchAuthed();
      await this.props.handleFetchUserInfo();
      this.setState({ currentStep: 3 });
      if (ConfigService.getReaderConfig("isProUpgraded") !== "yes") {
        try {
          ConfigService.setReaderConfig("isProUpgraded", "yes");
          await upgradePro();
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      this.props.handleLoadingDialog(false);
      if (service === "email") {
        toast(this.props.t("Please make sure the email and code are correct"));
      }
      toast.error(this.props.t("Login failed, error code") + ": " + res.msg);
    }
  };
  handleServerRegionChange = (region: string) => {
    ConfigService.setItem("serverRegion", region);
    this.setState({ serverRegion: region });
    resetReaderRequest();
    resetUserRequest();
    resetThirdpartyRequest();
  };

  render() {
    return (
      <>
        <Toaster />
        <div
          className="login-close-container"
          onClick={() => {
            this.props.history.push("/manager/home");
          }}
        >
          <span className="icon-close login-close-icon theme-color-delete"></span>
        </div>
        {this.props.isSettingOpen && <SettingDialog />}
        {this.props.isShowLoading && <LoadingDialog />}
        {this.state.currentStep === 0 && (
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
                <img
                  src={require("../../assets/images/logo-login.png")}
                  alt="logo"
                  className="login-logo-img"
                />
              </div>

              <img
                src={require("../../assets/images/background1.png")}
                alt="cover"
                className="login-cover-img"
              />
            </div>
            <div className="login-content-container">
              <img
                src={require("../../assets/images/illustration1.png")}
                alt="logo"
                className="login-content-illustration"
              />

              <div className="login-title">
                <Trans>
                  {this.props.t(
                    "Meticulously designed and built for Android and iOS"
                  )}
                </Trans>
              </div>
              <div className="login-subtitle">
                {this.props.t(
                  "After three years of design and development, the mobile version of Koodo Reader is finally out"
                )}
              </div>
              <div
                className="login-next-button"
                onClick={() => {
                  this.setState({
                    currentStep: 1,
                  });
                }}
              >
                {this.props.t("Next step")}
              </div>
            </div>
          </div>
        )}
        {this.state.currentStep === 1 && (
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
                <img
                  src={require("../../assets/images/logo-login.png")}
                  alt="logo"
                  className="login-logo-img"
                />
              </div>

              <img
                src={require("../../assets/images/background2.png")}
                alt="cover"
                className="login-cover-img"
              />
            </div>
            <div className="login-content-container">
              <img
                src={require("../../assets/images/illustration2.png")}
                alt="logo"
                className="login-content-illustration"
                style={{
                  width: "45%",
                }}
              />

              <div className="login-title" style={{ marginTop: "20%" }}>
                {this.props.t(
                  "Synchronize books and reading progress across all your devices"
                )}
              </div>
              <div className="login-subtitle">
                {this.props.t(
                  "With the integration of your cloud drive, WebDAV, and object storage, all your data remains securely in your control"
                )}
              </div>
              <div>
                <div
                  className="login-next-button"
                  onClick={() => {
                    this.setState({
                      currentStep: 0,
                    });
                  }}
                  style={{
                    borderWidth: "0px",
                    right: "140px",
                  }}
                >
                  {this.props.t("Last step")}
                </div>
                <div
                  className="login-next-button"
                  onClick={() => {
                    this.setState({
                      currentStep: 2,
                    });
                  }}
                >
                  {this.props.t("Next step")}
                </div>
              </div>
            </div>
          </div>
        )}
        {this.state.currentStep === 2 && (
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
                <img
                  src={require("../../assets/images/logo-login.png")}
                  alt="logo"
                  className="login-logo-img"
                />
              </div>

              <img
                src={require("../../assets/images/background3.png")}
                alt="cover"
                className="login-cover-img"
              />
            </div>
            <div className="login-content-container">
              <div
                className="login-title"
                style={{ marginTop: "80px", marginBottom: "30px" }}
              >
                {this.props.t(
                  "Embark on your journey of exploration with Koodo Reader Pro"
                )}
              </div>
              <div className="login-option-box">
                <div>
                  <div className="login-region-container">
                    <div className="login-region-title">
                      {this.props.t("Server region")}
                    </div>
                    <div>
                      <span
                        onClick={() => {
                          this.handleServerRegionChange("global");
                        }}
                        style={
                          this.state.serverRegion === "global"
                            ? { textDecoration: "underline" }
                            : {}
                        }
                      >
                        {this.props.t("Global")}
                      </span>
                      <span>{" | "}</span>
                      <span
                        onClick={() => {
                          this.handleServerRegionChange("china");

                          toast(
                            this.props.t(
                              "Some login options and data sources are not available in your selected server region"
                            )
                          );
                        }}
                        style={
                          this.state.serverRegion === "china"
                            ? { textDecoration: "underline" }
                            : {}
                        }
                      >
                        {this.props.t("China")}
                      </span>
                    </div>
                  </div>
                  {loginList
                    .filter((item) => {
                      if (this.state.serverRegion === "china") {
                        return item.isCNAvailable;
                      }
                      return true;
                    })
                    .map((item) => {
                      return (
                        <div
                          className="login-option-container"
                          key={item.value}
                          style={{}}
                          onClick={() => {
                            if (item.value === "email") {
                              this.setState({ currentStep: 5 });
                              return;
                            }
                            let url = LoginHelper.getAuthUrl(
                              item.value,
                              isElectron ? "desktop" : "browser",
                              ConfigService.getItem("serverRegion") ===
                                "china" && item.value === "microsoft"
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
                              Continue with{" "}
                              {{ label: this.props.t(item.label) }}
                            </Trans>
                          </div>
                        </div>
                      );
                    })}
                  <div
                    className="login-manual-token"
                    onClick={() => {
                      this.props.handleSetting(true);
                      this.props.handleSettingMode("account");
                    }}
                  >
                    {this.props.t("Manually enter login credentials")}
                  </div>
                  <div className="login-term">
                    {this.props.t(
                      "By clicking continue, you acknowledge that you have carefully read and agree to accept Koodo Reader's Terms of Service and Privacy Policy"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {this.state.currentStep === 3 && (
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
                <img
                  src={require("../../assets/images/logo-login.png")}
                  alt="logo"
                  className="login-logo-img"
                />
              </div>

              <img
                src={require("../../assets/images/background3.png")}
                alt="cover"
                className="login-cover-img"
              />
            </div>
            <div className="login-content-container">
              <div
                className="login-title"
                style={{ marginTop: "80px", marginBottom: "10%" }}
              >
                {this.props.t(
                  "Add a data source for data synchronization and backup"
                )}
              </div>
              <div className="login-sync-container">
                {driveList
                  .filter((item) => {
                    if (ConfigService.getItem("serverRegion") === "china") {
                      return item.isCNAvailable;
                    }
                    return true;
                  })
                  .filter((item) => {
                    if (!isElectron) {
                      return item.support.includes("browser");
                    } else {
                      return true;
                    }
                  })
                  .map((item) => {
                    return (
                      <div
                        className="login-sync-box"
                        key={item.value}
                        style={{}}
                        onClick={() => {
                          this.props.handleSetting(true);
                          this.props.handleSettingMode("sync");
                          this.props.handleSettingDrive(item.value);
                        }}
                      >
                        <div className="login-sync-title">
                          {this.props.t(item.label)}
                        </div>
                        <div className="login-sync-icon-container">
                          <span className={"icon-add login-sync-icon"}></span>
                        </div>
                        {ConfigService.getReaderConfig("lang") &&
                          ConfigService.getReaderConfig("lang").startsWith(
                            "zh"
                          ) &&
                          item.value === "webdav" && (
                            <div className="login-sync-text">
                              {this.props.t("Recommended (use with Nutstore)")}
                            </div>
                          )}
                        {ConfigService.getReaderConfig("lang") &&
                          ConfigService.getReaderConfig("lang").startsWith(
                            "zh"
                          ) &&
                          item.value === "microsoft" && (
                            <div className="login-sync-text">
                              {this.props.t("Access may be unstable in China")}
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
                  this.setState({
                    currentStep: 4,
                  });
                }}
                style={{
                  borderWidth: "0px",
                  right: "0px",
                  // bottom: "10px",
                }}
              >
                {this.props.t("Skip")}
              </div>
            </div>
          </div>
        )}
        {this.state.currentStep === 4 && (
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
                <img
                  src={require("../../assets/images/logo-login.png")}
                  alt="logo"
                  className="login-logo-img"
                />
              </div>

              <img
                src={require("../../assets/images/background3.png")}
                alt="cover"
                className="login-cover-img"
              />
            </div>
            <div className="login-content-container">
              <div
                className="login-title"
                style={{ marginTop: "50px", marginBottom: "20px" }}
              >
                {this.props.t(
                  "Download the mobile version to read and take notes anytime, anywhere"
                )}
              </div>
              <div className="login-mobile-container">
                <img
                  src={require("../../assets/images/mobile-qr.png")}
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
                  this.props.history.push("/manager/home");
                }}
                style={{
                  borderWidth: "0px",
                  right: "0px",
                }}
              >
                {this.props.t("Finish")}
              </div>
            </div>
          </div>
        )}
        {this.state.currentStep === 5 && (
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
                <img
                  src={require("../../assets/images/logo-login.png")}
                  alt="logo"
                  className="login-logo-img"
                />
              </div>

              <img
                src={require("../../assets/images/background3.png")}
                alt="cover"
                className="login-cover-img"
              />
            </div>
            <div className="login-content-container">
              <div
                className="login-title"
                style={{ marginTop: "80px", marginBottom: "50px" }}
              >
                {this.props.t(
                  "Embark on your journey of exploration with Koodo Reader Pro"
                )}
              </div>
              <div className="login-option-box">
                <div>
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
                    className="login-input-container"
                    style={{}}
                  />
                  <div style={{ position: "relative" }}>
                    <input
                      type={"text"}
                      name={"code"}
                      placeholder={this.props.t("Enter code")}
                      onChange={(e) => {
                        if (e.target.value) {
                          this.setState((prevState) => ({
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
                      style={{
                        position: "absolute",
                        right: "30px",
                        top: "30px",
                        textAlign: "right",
                        cursor: "pointer",
                        fontSize: "15px",
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

                  <div
                    className="login-manual-token"
                    onClick={async () => {
                      if (
                        !this.state.loginConfig.token ||
                        !this.state.loginConfig.email
                      ) {
                        toast.error(
                          this.props.t("Missing parameters") +
                            this.props.t("Token")
                        );
                        return;
                      }
                      this.handleLogin(
                        this.state.loginConfig.email +
                          "#" +
                          this.state.loginConfig.token,
                        "email"
                      );
                    }}
                    style={{
                      marginTop: "10px",
                    }}
                  >
                    {this.props.t("Continue")}
                  </div>
                  <div className="login-term">
                    {this.props.t(
                      "7-days free trial only applys to users who registered with recommended email providers. Recommended email providers are as follows"
                    )}
                    <br />
                    {CommonTool.EmailProviders.join(", ")}
                  </div>
                  <div
                    className="login-next-button"
                    onClick={() => {
                      this.setState({
                        currentStep: 2,
                      });
                    }}
                    style={{
                      borderWidth: "0px",
                      right: "0px",
                    }}
                  >
                    {this.props.t("Back")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default withRouter(Login as any);
