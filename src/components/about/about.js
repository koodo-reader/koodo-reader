//左下角的图标外链
import React, { Component } from "react";
import { connect } from "react-redux";
import "./about.css";

class About extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isNew: false,
      isGithub: false,
      isContact: false,
      isDonate: false
    };
  }
  handleGithub = mode => {
    this.setState({ isGithub: mode });
  };
  handleContact = mode => {
    this.setState({ isContact: mode });
  };
  handleDonate = mode => {
    this.setState({ isDonate: mode });
  };
  render() {
    return (
      <div className="about-container">
        <div className="about-icon-container">
          <a
            href="https://wj.qq.com/s2/5565378/4b3f/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span
              className="icon-github about-icon"
              onMouseEnter={() => {
                this.handleGithub(true);
              }}
              onMouseLeave={() => {
                this.handleGithub(false);
              }}
            ></span>
          </a>
          <a
            href="https://wj.qq.com/s2/5565378/4b3f/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span
              className="icon-contact about-icon"
              onMouseEnter={() => {
                this.handleContact(true);
              }}
              onMouseLeave={() => {
                this.handleContact(false);
              }}
            ></span>
          </a>
          <a
            href="https://wj.qq.com/s2/5565378/4b3f/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span
              className="icon-donate about-icon"
              onMouseEnter={() => {
                this.handleDonate(true);
              }}
              onMouseLeave={() => {
                this.handleDonate(false);
              }}
            ></span>
          </a>
        </div>
        {this.state.isGithub ? (
          <div className="about-box">
            <div className="about-message">
              本项目所有代码均已在GitHub上开源，点击前往查看
            </div>
          </div>
        ) : null}
        {this.state.isContact ? (
          <div className="about-box">
            <div className="about-message">
              向开发者反馈您在使用过程中遇到的问题和改进建议
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
const mapStateToProps = state => {
  return {};
};
const actionCreator = {};
About = connect(mapStateToProps, actionCreator)(About);
export default About;
