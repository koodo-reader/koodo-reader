import React from "react";
import { LoginProps, LoginState } from "./interface";
import { Trans } from "react-i18next";
import {
  getLoginParamsFromUrl,
  getParamsFromUrl,
} from "../../utils/file/common";
import copy from "copy-text-to-clipboard";
import { withRouter } from "react-router-dom";
import Lottie from "react-lottie";

import animationSuccess from "../../assets/lotties/success.json";
import toast, { Toaster } from "react-hot-toast";
import ConfigService from "../../utils/storage/configService";
import { loginList } from "../../constants/loginList";
import { openExternalUrl, removeSearchParams } from "../../utils/common";
import { LoginHelper } from "../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import { driveList } from "../../constants/driveList";
import { loginRegister } from "../../utils/request/user";

class Login extends React.Component<LoginProps, LoginState> {
  constructor(props: LoginProps) {
    super(props);
    this.state = {
      currentStep: 0,
    };
  }

  componentDidMount() {
    console.log("isElectron", isElectron);
    if (isElectron) {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.on("oauth-callback", (event, config) => {
        console.log("Received OAuth config:", config);
        let code = config.code;
        let state = config.state;
        this.setState({ currentStep: 2 });
        if (state) {
          let { service, deeplink } = JSON.parse(
            decodeURIComponent(state.split("|")[1])
          );
          console.log(code, service, deeplink);
          this.handleLogin(code, service);
        }
      });
    } else {
      let url = document.location.href;
      console.log(url);
      if (url.indexOf("code") > -1) {
        let params: any = getLoginParamsFromUrl();
        let code = params.code;
        let state = params.state;
        this.setState({ currentStep: 2 });
        console.log(code, state);
        if (state) {
          let { service, deeplink } = JSON.parse(
            decodeURIComponent(state.split("|")[1])
          );
          console.log(code, service, deeplink);
          this.handleLogin(code, service);
        }
      }
    }
  }
  handleLogin = async (code: string, service: string) => {
    let resCode = await loginRegister(service, code);
    if (resCode === 200) {
      toast.success("登录成功");
      removeSearchParams();
      this.setState({ currentStep: 3 });
    }
  };

  render() {
    if (this.state.currentStep === 0) {
      return (
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
              为安卓和 iOS 平台精心设计和开发的客户端
            </div>
            <div className="login-subtitle">
              经过长达3年的设计和开发，移动版的 Koodo Reader 终于要和大家见面了
            </div>
            <div
              className="login-next-button"
              onClick={() => {
                this.setState({
                  currentStep: 1,
                });
              }}
            >
              下一个
            </div>
            <div
              className="login-close-container"
              onClick={() => {
                this.props.history.push("/manager/home");
              }}
            >
              <span className="icon-close login-close-icon"></span>
            </div>
          </div>
          <Toaster />
        </div>
      );
    }
    if (this.state.currentStep === 1) {
      return (
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
              style={{
                width: "60%",
                marginLeft: "0px",
              }}
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
              在您所有的设备之间自动同步图书和阅读记录
            </div>
            <div className="login-subtitle">
              借助您绑定的网盘，WebDAV 和对象存储实现，您所有的数据都由您掌握
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
                上一个
              </div>
              <div
                className="login-next-button"
                onClick={() => {
                  this.setState({
                    currentStep: 2,
                  });
                }}
              >
                下一个
              </div>
            </div>

            <div
              className="login-close-container"
              onClick={() => {
                this.props.history.push("/manager/home");
              }}
            >
              <span className="icon-close login-close-icon"></span>
            </div>
          </div>
          <Toaster />
        </div>
      );
    }
    if (this.state.currentStep === 2) {
      return (
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
              style={{ marginTop: "100px", marginBottom: "15%" }}
            >
              从一个账号开始，开始探索Koodo Reader 专业版
            </div>
            {loginList.map((item) => {
              return (
                <div
                  className="login-option-container"
                  key={item.value}
                  style={{}}
                  onClick={() => {
                    let url = LoginHelper.getAuthUrl(item.value);
                    if (url) {
                      openExternalUrl(url);
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
                    使用 {item.label} 继续
                  </div>
                </div>
              );
            })}
            <div className="login-term">
              点击继续即代表您已认真阅读并同意接受 Koodo Reader
              的《服务条款》、《隐私政策》。
            </div>
            <div
              className="login-close-container"
              onClick={() => {
                this.props.history.push("/manager/home");
              }}
            >
              <span className="icon-close login-close-icon"></span>
            </div>
          </div>
          <Toaster />
        </div>
      );
    }
    if (this.state.currentStep === 3) {
      return (
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
              添加数据源，用于数据同步和备份
            </div>
            <div className="login-sync-container">
              {" "}
              {driveList.map((item) => {
                return (
                  <div
                    className="login-sync-box"
                    key={item.value}
                    style={{}}
                    onClick={() => {
                      let url = LoginHelper.getAuthUrl(item.value);
                      if (url) {
                        openExternalUrl(url);
                      }
                    }}
                  >
                    <div className="login-sync-title">
                      {this.props.t(item.label)}
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
              跳过
            </div>
            <div
              className="login-close-container"
              onClick={() => {
                this.props.history.push("/manager/home");
              }}
            >
              <span className="icon-close login-close-icon"></span>
            </div>
          </div>
          <Toaster />
        </div>
      );
    }
    if (this.state.currentStep === 4) {
      return (
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
              下载移动版，随时随地阅读和记录
            </div>
            <div className="login-mobile-container">
              <img
                src={require("../../assets/images/mobile-qr.png")}
                alt="logo"
                className="login-mobile-qr"
                style={{
                  width: "45%",
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
              跳过
            </div>
            <div
              className="login-close-container"
              onClick={() => {
                this.props.history.push("/manager/home");
              }}
            >
              <span className="icon-close login-close-icon"></span>
            </div>
          </div>
          <Toaster />
        </div>
      );
    }
  }
}

export default withRouter(Login as any);
