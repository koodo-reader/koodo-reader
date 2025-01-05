import React from "react";
import "./updateInfo.css";
import { TipDialogProps, TipDialogState } from "./interface";
import { Trans } from "react-i18next";
import Lottie from "react-lottie";
import animationDownload from "../../../assets/lotties/message.json";

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
          <span className="icon-close tip-close-icon"></span>
        </div>

        <div className="download-desk-title">
          <Trans>Tips</Trans>
        </div>

        <div className="download-desk-feature-container">
          <div className="download-desk-feature-item">
            <Trans>{this.props.tip}</Trans>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            className="new-version-open"
            onClick={() => {
              this.handleClose();
            }}
            style={{ marginTop: "-10px" }}
          >
            <Trans>Understand</Trans>
          </div>
        </div>

        <div className="download-desk-animation">
          <Lottie options={downloadOptions} height={100} width={200} />
        </div>
      </div>
    );
  }
}

export default TipDialog;
