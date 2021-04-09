//排序弹窗
import React from "react";
import { Trans } from "react-i18next";
import { AboutDialogProps, AboutDialogState } from "./interface";
import { isElectron } from "react-device-detect";

class AboutDialog extends React.Component<AboutDialogProps, AboutDialogState> {
  constructor(props: AboutDialogProps) {
    super(props);
    this.state = {};
  }
  handleJump = (url: string) => {
    isElectron
      ? window.require("electron").shell.openExternal(url)
      : window.open(url);
    this.props.handleAbout(false);
  };
  render() {
    return (
      <div
        className="sort-dialog-container"
        onMouseLeave={() => {
          this.props.handleAbout(!this.props.isAboutOpen);
        }}
        style={{
          left: "525px",
          boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.18)",
          height: "155px",
          width: "120px",
        }}
      >
        <ul className="sort-by-category">
          <li
            className="sort-by-category-list"
            onClick={() => {
              this.props.handleSetting(true);
              this.props.handleAbout(false);
            }}
            style={{ color: "rgba(75, 75, 75, 1)" }}
          >
            <Trans>Setting</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={() => {
              this.handleJump(
                "https://github.com/troyeguo/koodo-reader/issues"
              );
            }}
            style={{ color: "rgba(75, 75, 75, 1)" }}
          >
            <Trans>Feedback</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={() => {
              this.handleJump(
                "https://github.com/troyeguo/koodo-reader/issues/106"
              );
            }}
            style={{ color: "rgba(75, 75, 75, 1)" }}
          >
            <Trans>Help</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={() => {
              this.handleJump("https://koodo.960960.xyz");
            }}
            style={{ color: "rgba(75, 75, 75, 1)" }}
          >
            <Trans>Our Website</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={() => {
              this.handleJump("https://960960.xyz");
            }}
            style={{ color: "rgba(75, 75, 75, 1)" }}
          >
            <Trans>About author</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={() => {
              this.handleJump("https://github.com/troyeguo/koodo-reader");
            }}
            style={{ color: "rgba(75, 75, 75, 1)" }}
          >
            <Trans>Github Repo</Trans>
          </li>
        </ul>
      </div>
    );
  }
}

export default AboutDialog;
