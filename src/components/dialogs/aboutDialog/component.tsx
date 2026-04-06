import React from "react";
import { Trans } from "react-i18next";
import { AboutDialogProps, AboutDialogState } from "./interface";
import { getWebsiteUrl, openExternalUrl } from "../../../utils/common";
import "./aboutDialog.css";
declare var window: any;
class AboutDialog extends React.Component<AboutDialogProps, AboutDialogState> {
  constructor(props: AboutDialogProps) {
    super(props);
    this.state = {
      isShowExportAll: false,
    };
  }
  handleJump = (url: string) => {
    openExternalUrl(url);
    this.props.handleAbout(false);
  };

  render() {
    return (
      <>
        <div
          className="sort-dialog-container"
          onMouseLeave={() => {
            this.props.handleAbout(false);
          }}
          onMouseEnter={() => {
            this.props.handleAbout(true);
          }}
          style={{ left: "480px" }}
        >
          <ul className="sort-by-category">
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.props.handleSetting(true);
                this.props.handleAbout(false);
              }}
            >
              <Trans>Setting</Trans>
            </li>

            {this.props.isNewWarning && (
              <li
                className="sort-by-category-list"
                onClick={() => {
                  this.handleJump(getWebsiteUrl());
                }}
                style={{ color: "rgb(35, 170, 242)" }}
              >
                <Trans>New version</Trans>
              </li>
            )}
          </ul>
        </div>
      </>
    );
  }
}

export default AboutDialog;
