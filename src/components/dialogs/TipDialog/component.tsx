//提示更新的文字
import React from "react";
import "./updateInfo.css";
import { TipDialogProps, TipDialogState } from "./interface";
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

class TipDialog extends React.Component<TipDialogProps, TipDialogState> {
  constructor(props: TipDialogProps) {
    super(props);
    this.state = {};
  }

  handleClose = () => {
    this.props.handleTipDialog(false);
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
          <Trans>Tips</Trans>
        </div>
        <div className="download-desk-subtile">
          <Trans>How sync works</Trans>
        </div>
        <div className="download-desk-feature-container">
          <div className="download-desk-feature-item">
            <Trans>
              You need to manually change the storage location to the same sync
              folder on different computers. When you click the sync button,
              Koodo Reader will automatically upload or download the data from
              this folder according the timestamp.
            </Trans>
          </div>
        </div>

        <div className="download-desk-animation">
          <Lottie options={downloadOptions} height={250} width={350} />
        </div>
      </div>
    );
  }
}

export default TipDialog;
