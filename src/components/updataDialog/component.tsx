//更新提示弹窗
import React from "react";
import "./updateDialog.css";
import { UpdateInfoProps, UpdateInfoState } from "./interface";
import { Trans } from "react-i18next";
import { updateLog } from "../../constants/readerConfig";

class UpdateDialog extends React.Component<UpdateInfoProps, UpdateInfoState> {
  constructor(props: UpdateInfoProps) {
    super(props);
    this.state = { downlownLink: "" };
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

  render() {
    return (
      <div className="update-dialog-container">
        <p className="update-dialog-title">
          <Trans>What's new about this version</Trans>
        </p>
        <p className="update-dialog-subtitle">
          <Trans>Version</Trans>
          {updateLog.version}
        </p>
        <p className="update-dialog-subtitle">
          <Trans>Date</Trans>
          {updateLog.date}
        </p>

        <div className="update-dialog-info">
          <p className="update-dialog-new-title">
            <Trans>What's New</Trans>
          </p>
          <ul className="update-dialog-new-container">
            {this.renderList(updateLog.new)}
          </ul>
          <p className="update-dialog-fix-title">
            <Trans>What's been fixed</Trans>
          </p>
          <ul className="update-dialog-fix-container">
            {this.renderList(updateLog.fix)}
          </ul>
        </div>

        <div
          className="update-dialog-container-button"
          onClick={() => {
            this.props.handleUpdateDialog();
          }}
        >
          <Trans>Confirm</Trans>
        </div>
        <p className="update-dialog-url">
          <span style={{ color: "#959595" }}>
            <Trans>Our Website</Trans>
          </span>
          koodo.960960.xyz
        </p>
        <img
          src="/assets/empty.svg"
          alt=""
          className="update-dialog-illustration"
        />
      </div>
    );
  }
}

export default UpdateDialog;
