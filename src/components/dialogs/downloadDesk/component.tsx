//提示更新的文字
import React from "react";
import "./updateInfo.css";
import { DownloadDeskProps, DownloadDeskState } from "./interface";
import { Trans } from "react-i18next";
import Lottie from "react-lottie";
import animationDownload from "../../../assets/lotties/download.json";

const downloadOptions = {
  loop: true,
  autoplay: true,
  animationData: animationDownload,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};
declare var window: any;

class DownloadDesk extends React.Component<
  DownloadDeskProps,
  DownloadDeskState
> {
  constructor(props: DownloadDeskProps) {
    super(props);
    this.state = {};
  }

  handleClose = () => {
    this.props.handleDownloadDesk(false);
  };
  render() {
    return (
      <div className="download-desk-container">
        <div
          className="setting-close-container"
          onClick={() => {
            this.handleClose();
          }}
        >
          <span className="icon-close"></span>
        </div>

        <div className="download-desk-title">
          <Trans>Download Desktop Version</Trans>
        </div>
        <div className="download-desk-subtile">
          <Trans>
            Koodo Reader's web version are limited by the browser, for more
            powerful features, please download the desktop version.
          </Trans>
        </div>
        <div className="download-desk-feature-container">
          <div className="download-desk-feature-item">
            <Trans>Use the fonts from your local computer</Trans>
          </div>
          <div className="download-desk-feature-item">
            <Trans>Backup your data with Webdav</Trans>
          </div>
        </div>
        <div
          className="download-desk-button"
          onClick={() => {
            window.open("https://koodo.960960.xyz/download");
          }}
        >
          <Trans>Download</Trans>
        </div>
        <div className="download-desk-animation">
          <Lottie options={downloadOptions} height={250} width={350} />
        </div>
      </div>
    );
  }
}

export default DownloadDesk;
