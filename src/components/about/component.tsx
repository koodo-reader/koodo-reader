//左下角的图标外链
import React from "react";
import "./about.css";
import { AboutProps, AboutState } from "./interface";

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
    this.props.handleMessage("Copy Link Successfully");
    this.props.handleMessageBox(true);
  };
  render() {
    return (
      <div className="about-container">
        <div className="about-icon-container">
          <span
            className="icon-github about-icon"
            onClick={() => {
              this.handleClick("https://github.com/troyeguo/koodo-reader");
            }}
          ></span>

          <span
            className="icon-contact about-icon"
            onClick={() => {
              this.handleClick("https://wj.qq.com/s2/5565378/4b3f/");
            }}
          ></span>

          <span
            className="icon-donate about-icon"
            onClick={() => {
              this.handleClick("https://github.com/troyeguo/coodo-pay");
            }}
          ></span>
        </div>
      </div>
    );
  }
}

export default About;
