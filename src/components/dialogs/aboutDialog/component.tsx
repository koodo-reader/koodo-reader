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
          this.props.handleAbout(false);
        }}
        onMouseEnter={() => {
          this.props.handleAbout(true);
        }}
        style={
          this.props.isNewWarning
            ? { left: "525px", height: "220px", width: "120px" }
            : {
                left: "525px",
                height: "200px",
                width: "120px",
              }
        }
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

          <li
            className="sort-by-category-list"
            onClick={() => {
              if (navigator.language.indexOf("zh") > -1) {
                this.handleJump(
                  "https://www.notion.so/troyeguo/e9c4e5755d564b0db6340eeba6d9ece9?v=7c8fcbed9adf4592ada95cfd593868c9"
                );
              } else {
                this.handleJump(
                  "https://www.notion.so/troyeguo/01aaa516687c418499f713d34793b9ad?v=54d51fe1688a4f8ab5784b17e4df3308"
                );
              }
            }}
          >
            <Trans>Help</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={() => {
              this.handleJump("https://koodo.960960.xyz/support");
            }}
          >
            <Trans>Feedback</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={() => {
              this.handleJump("https://forms.office.com/r/tgD1ZizHB2");
            }}
          >
            <Trans>Survey</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={() => {
              if (navigator.language.indexOf("zh") > -1) {
                this.handleJump(
                  "https://www.notion.so/troyeguo/215baeda57804fd29dbb0e91d1e6a021?v=360c00183d944b598668f34c255edfd7"
                );
              } else {
                this.handleJump(
                  "https://www.notion.so/troyeguo/d1c19a132932465bae1d89dd963c92ea?v=ca8aa69cf25849c18c92b92ba868663b"
                );
              }
            }}
          >
            <Trans>Roadmap</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={() => {
              this.handleJump("https://koodo.960960.xyz");
            }}
          >
            <Trans>Our Website</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={() => {
              this.handleJump("https://960960.xyz");
            }}
          >
            <Trans>About developer</Trans>
          </li>
          <li
            className="sort-by-category-list"
            onClick={() => {
              this.handleJump("https://github.com/troyeguo/koodo-reader");
            }}
          >
            <Trans>Github Repo</Trans>
          </li>
          {this.props.isNewWarning && (
            <li
              className="sort-by-category-list"
              onClick={() => {
                this.handleJump("https://koodo.960960.xyz/download");
              }}
              style={{ color: "rgb(35, 170, 242)" }}
            >
              <Trans>New Version</Trans>
            </li>
          )}
        </ul>
      </div>
    );
  }
}

export default AboutDialog;
