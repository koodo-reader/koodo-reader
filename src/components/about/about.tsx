//左下角的图标外链
import React from "react";
import { connect } from "react-redux";
import "./about.css";
import { handleMessageBox, handleMessage } from "../../redux/manager.redux";
export interface AboutProps {
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
}
export interface AboutState {
  isNew: boolean;
  isGithub: boolean;
  isContact: boolean;
  isDonate: boolean;
}
//class App extends React.Component<AppProps, AppState> {
class About extends React.Component<AboutProps, AboutState> {
  constructor(props: AboutProps) {
    super(props);
    this.state = {
      isNew: false,
      isGithub: false,
      isContact: false,
      isDonate: false,
    };
  }
  handleGithub = (mode: boolean) => {
    this.setState({ isGithub: mode });
  };
  handleContact = (mode: boolean) => {
    this.setState({ isContact: mode });
  };
  handleDonate = (mode: boolean) => {
    this.setState({ isDonate: mode });
  };
  handleClick = (str: string) => {
    const el = document.createElement("textarea");
    el.value = str;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    this.props.handleMessage("链接复制成功");
    this.props.handleMessageBox(true);
  };
  render() {
    return (
      <div className="about-container">
        <div className="about-icon-container">
          <span
            className="icon-github about-icon"
            onMouseEnter={() => {
              this.handleGithub(true);
            }}
            onMouseLeave={() => {
              this.handleGithub(false);
            }}
            onClick={() => {
              this.handleClick("https://github.com/troyeguo/koodo-reader");
            }}
          ></span>

          <span
            className="icon-contact about-icon"
            onMouseEnter={() => {
              this.handleContact(true);
            }}
            onMouseLeave={() => {
              this.handleContact(false);
            }}
            onClick={() => {
              this.handleClick("https://wj.qq.com/s2/5565378/4b3f/");
            }}
          ></span>

          <span
            className="icon-donate about-icon"
            onMouseEnter={() => {
              this.handleDonate(true);
            }}
            onMouseLeave={() => {
              this.handleDonate(false);
            }}
            onClick={() => {}}
          ></span>
        </div>
        {this.state.isGithub ? (
          <div className="about-box">
            <div className="about-message">
              本项目所有代码均已在GitHub上开源，点击复制项目地址
            </div>
          </div>
        ) : null}
        {this.state.isContact ? (
          <div className="about-box">
            <div className="about-message">
              向开发者反馈您在使用过程中遇到的问题和改进建议，点击复制反馈地址
            </div>
          </div>
        ) : null}
        {this.state.isDonate ? (
          <div className="about-box">
            <div className="about-message">
              维护本项目需要占用大量时间，如果您觉得本项目对您有帮助，欢迎打赏开发者
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}
const mapStateToProps = () => {
  return {};
};
const actionCreator = { handleMessageBox, handleMessage };
export default connect(mapStateToProps, actionCreator)(About);
