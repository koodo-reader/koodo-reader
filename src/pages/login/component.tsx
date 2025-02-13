import React from "react";
import { LoginProps, LoginState } from "./interface";
import { Trans } from "react-i18next";
import { getLoginParamsFromUrl } from "../../utils/file/common";
import { withRouter } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { loginList } from "../../constants/loginList";
import { openExternalUrl, removeSearchParams } from "../../utils/common";
import { LoginHelper } from "../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import { driveList } from "../../constants/driveList";
import { loginRegister } from "../../utils/request/user";
import SettingDialog from "../../components/dialogs/settingDialog";
import LoadingDialog from "../../components/dialogs/loadingDialog";

class Login extends React.Component<LoginProps, LoginState> {
  constructor(props: LoginProps) {
    super(props);
    this.state = {
      currentStep: 0,
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
  handleLogin = async (code: string, service: string) => {
    this.props.handleLoadingDialog(true);
    let resCode = await loginRegister(service, code);
    if (resCode === 200) {
      this.props.handleLoadingDialog(false);
      toast.success(this.props.t("Login successful"));
      removeSearchParams();
      this.props.handleFetchAuthed();
      this.setState({ currentStep: 3 });
    }
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
          <span className="icon-close login-close-icon"></span>
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
                style={{ marginTop: "80px", marginBottom: "50px" }}
              >
                {this.props.t(
                  "Embark on your journey of exploration with Koodo Reader Pro"
                )}
              </div>
              {loginList.map((item) => {
                return (
                  <div
                    className="login-option-container"
                    key={item.value}
                    style={{}}
                    onClick={() => {
                      let url = LoginHelper.getAuthUrl(
                        item.value,
                        isElectron ? "desktop" : "browser"
                      );
                      if (url) {
                        if (isElectron) {
                          openExternalUrl(url);
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
                        Continue with {{ label: this.props.t(item.label) }}
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
                {driveList.map((item) => {
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
      </>
    );
  }
}

export default withRouter(Login as any);
