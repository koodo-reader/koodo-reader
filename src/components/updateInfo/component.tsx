//提示更新的文字
import React from "react";
import "./updateInfo.css";
import { UpdateInfoProps, UpdateInfoState } from "./interface";
import { version } from "../../../package.json";
import { Trans } from "react-i18next";
import axios from "axios";
import Lottie from "react-lottie";
import animationData from "../../assets/new.json";
import copy from "copy-text-to-clipboard";
const isElectron = require("is-electron");
const defaultOptions = {
  loop: false,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};

declare var window: any;

class UpdateInfo extends React.Component<UpdateInfoProps, UpdateInfoState> {
  constructor(props: UpdateInfoProps) {
    super(props);
    this.state = {
      downlownLink: "",
      updateLog: "",
    };
  }
  componentDidMount() {
    console.log(this.state.updateLog, "this.state.updateLog");
    !this.props.currentBook.key &&
      axios
        .get("https://koodo.960960.xyz/api/update")
        .then((res) => {
          console.log(res);
          const download = res.data.download;
          const newVersion = res.data.log.version;

          if (version !== newVersion) {
            this.setState({ updateLog: res.data.log });
            this.props.handleNewDialog(true);

            navigator.platform.indexOf("Linux") > -1
              ? this.setState({ downlownLink: download[2].url })
              : navigator.platform.indexOf("Mac") > -1
              ? this.setState({ downlownLink: download[1].url })
              : this.setState({ downlownLink: download[0].url });
          }
        })
        .catch((err) => {
          console.log(err);
        });
  }
  renderList = (arr: any[]) => {
    return arr.map((item, index) => {
      return (
        <li className="update-dialog-list" key={index}>
          <span style={{ color: "black" }}>{index + 1 + ". "}</span>
          <span>{item}</span>
        </li>
      );
    });
  };
  handleJump = () => {
    isElectron() &&
      window.require("electron").shell.openExternal(this.state.downlownLink);
  };
  handleClose = () => {
    this.setState({ updateLog: "" });
    this.props.handleNewDialog(false);
  };
  render() {
    return (
      <>
        <div
          className="update-info-container"
          style={this.state.downlownLink ? {} : { display: "none" }}
          onClick={() => {
            this.handleJump();
          }}
        >
          <Trans>New Version Available</Trans>
        </div>
        {this.state.updateLog && (
          <div className="new-version">
            <div className="new-version-title">
              <Trans>New Version Available</Trans>
            </div>
            <div className="setting-close-container">
              <span
                className="icon-close setting-close"
                onClick={() => {
                  this.handleClose();
                }}
              ></span>
            </div>
            <div className="update-dialog-info" style={{ height: 420 }}>
              <div className="new-version-animation">
                <Lottie options={defaultOptions} height={240} width={240} />
              </div>
              <div
                className="new-version-open"
                onClick={() => {
                  this.handleJump();
                }}
              >
                <Trans>Open link in browser</Trans>
              </div>
              <div
                className="new-version-copy"
                onClick={() => {
                  copy(this.state.downlownLink);
                  this.props.handleMessage("Copy Successfully");
                  this.props.handleMessageBox(true);
                }}
              >
                <Trans>Copy Link</Trans>
              </div>

              <p className="update-dialog-new-title">
                <Trans>What's New</Trans>
              </p>
              <ul className="update-dialog-new-container">
                {this.renderList(this.state.updateLog.new)}
              </ul>
              <p className="update-dialog-fix-title">
                <Trans>What's been fixed</Trans>
              </p>
              <ul className="update-dialog-fix-container">
                {this.renderList(this.state.updateLog.fix)}
              </ul>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default UpdateInfo;
