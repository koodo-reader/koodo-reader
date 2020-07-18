//左下角的图标外链
import React from "react";
import "./about.css";
import { AboutProps, AboutState } from "./interface";
import packageJson from "../../../package.json";
import axios from "axios";

class About extends React.Component<AboutProps, AboutState> {
  constructor(props: AboutProps) {
    super(props);
    this.state = { downlownLink: "" };
  }
  componentDidMount() {
    console.log(packageJson.version);
    console.log(navigator.platform, "os");
    axios.get("http://localhost:3001/update").then((res) => {
      const download = res.data.download;
      const version = res.data.log.version;
      if (this.compareVersion(packageJson.version, version)) {
        navigator.platform === "Win32"
          ? this.setState({ downlownLink: download[0].url })
          : this.setState({ downlownLink: download[1].url });
      }
    });
  }
  compareVersion = (ver1: string, ver2: string) => {
    const ver1Arr = ver1.split(".");
    const ver2Arr = ver2.split(".");

    for (let i = 0; i < ver1Arr.length; i++) {
      if (ver1Arr[i] < ver2Arr[i]) {
        return true;
      }
    }
    return false;
  };
  render() {
    console.log(this.state.downlownLink, "link");
    return (
      <div
        className="about-icon-container"
        style={this.state.downlownLink ? {} : { display: "none" }}
      >
        <a
          href={this.state.downlownLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          下载新版本
        </a>
      </div>
    );
  }
}

export default About;
