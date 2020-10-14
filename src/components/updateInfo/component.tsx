//提示更新的文字
import React from "react";
import "./updateInfo.css";
import { UpdateInfoProps, UpdateInfoState } from "./interface";
import { updateLog } from "../../constants/readerConfig";
import { Trans } from "react-i18next";
import axios from "axios";
const isElectron = require("is-electron");

declare var window: any;

class UpdateInfo extends React.Component<UpdateInfoProps, UpdateInfoState> {
  constructor(props: UpdateInfoProps) {
    super(props);
    this.state = { downlownLink: "" };
  }
  componentDidMount() {
    !this.props.currentBook.key &&
      axios
        .get("https://koodo.960960.xyz/api/update")
        .then((res) => {
          console.log(res);
          const download = res.data.download;
          const version = res.data.log.version;
          if (this.compareVersion(updateLog.version, version)) {
            navigator.platform === "Win32"
              ? this.setState({ downlownLink: download[0].url })
              : this.setState({ downlownLink: download[1].url });
          }
        })
        .catch((err) => {
          console.log(err);
        });
  }

  handleJump = () => {
    isElectron() &&
      window.require("electron").shell.openExternal(this.state.downlownLink);
  };
  compareVersion = (ver1: string, ver2: string) => {
    const ver1Arr = ver1.split(".");
    const ver2Arr = ver2.split(".");

    for (let i = 0; i < ver1Arr.length; i++) {
      if (parseInt(ver1Arr[i]) < parseInt(ver2Arr[i])) {
        return true;
      }
    }
    return false;
  };
  render() {
    return (
      <div
        className="update-info-container"
        style={this.state.downlownLink ? {} : { display: "none" }}
        onClick={() => {
          this.handleJump();
        }}
      >
        <Trans>New Version Available</Trans>
      </div>
    );
  }
}

export default UpdateInfo;
