import React, { Component } from "react";
import { Trans } from "react-i18next";
import { FeedbackDialogProps, FeedbackDialogState } from "./interface";
import toast from "react-hot-toast";
import "./feedbackDialog.css";
import packageInfo from "../../../../package.json";
import { openExternalUrl } from "../../../utils/serviceUtils/urlUtil";
import { checkDeveloperUpdate } from "../../../utils/commonUtil";
class FeedbackDialog extends Component<
  FeedbackDialogProps,
  FeedbackDialogState
> {
  constructor(props: FeedbackDialogProps) {
    super(props);
    this.state = { isNew: false, developerVersion: "1.0.0", isSending: false };
  }
  async componentDidMount() {
    let version = (await checkDeveloperUpdate()).version.substr(1);
    this.setState({ developerVersion: version });
  }
  handleCancel = () => {
    this.props.handleFeedbackDialog(false);
  };

  handleComfirm = async () => {
    this.setState({ isSending: true });
    let content: string = (
      document.querySelector(
        "#feedback-dialog-content-box"
      ) as HTMLTextAreaElement
    ).value;
    let subject: string = (
      document.querySelector(
        "#feedback-dialog-subject-box"
      ) as HTMLTextAreaElement
    ).value;
    let email: string = (
      document.querySelector(
        "#feedback-dialog-email-box"
      ) as HTMLTextAreaElement
    ).value;

    let version = packageInfo.version;
    const os = window.require("os");
    const system = os.platform() + " " + os.version();
    const axios = window.require("axios");
    let data = JSON.stringify({
      version,
      os: system,
      subject,
      content,
      email,
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://koodo.960960.xyz/api/feedback",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    let res = await axios.request(config);
    if (res.data.result !== "ok") {
      toast.error(this.props.t("Error happens"));
      this.setState({ isSending: false });
      return;
    }
    toast.success(this.props.t("Send successfully"));
    this.props.handleFeedbackDialog(false);
  };
  handleJump = (url: string) => {
    openExternalUrl(url);
  };
  render() {
    return (
      <div className="feedback-dialog-container">
        <div className="feedback-dialog-box">
          <div className="feedback-dialog-title">
            <Trans>Feedback</Trans>
          </div>
          <div className="feedback-dialog-info-text">
            <Trans>
              Thanks for using the developer version of Koodo Reader, leave a
              comment if you encounter any problems. Noted that we can't reply
              to you from here. For faster and better support, please visit
            </Trans>
            &nbsp;
            <span
              onClick={() => {
                this.handleJump(`https://koodo.960960.xyz/en/support`);
              }}
              style={{ color: "rgb(35, 170, 242)", cursor: "pointer" }}
            >
              <Trans>Our Website</Trans>
            </span>
          </div>

          {packageInfo.version.localeCompare(this.state.developerVersion) <
            0 && (
            <div
              className="feedback-dialog-info-text"
              style={{ color: "rgb(231, 69, 69)" }}
            >
              <Trans>
                You're not using the latest version of Koodo Reader. Please
                update to the latest version to see if the problem still exsits
              </Trans>
            </div>
          )}

          <>
            <textarea
              name="subject"
              placeholder={this.props.t("Brief description of the problem")}
              id="feedback-dialog-subject-box"
              className="feedback-dialog-content-box"
            />
            <textarea
              name="content"
              placeholder={this.props.t("Detailed description of the problem")}
              id="feedback-dialog-content-box"
              className="feedback-dialog-content-box"
            />
            <textarea
              name="email"
              placeholder={this.props.t(
                "Your email(optional), We may contact you for further investigation"
              )}
              id="feedback-dialog-email-box"
              className="feedback-dialog-content-box"
            />
          </>

          <div
            className="token-dialog-cancel"
            onClick={() => {
              this.handleCancel();
            }}
            style={{ left: "100px", top: "430px" }}
          >
            <Trans>Cancel</Trans>
          </div>
          {this.state.isSending ? (
            <div
              className="token-dialog-comfirm"
              style={{ left: "180px", top: "430px" }}
            >
              <Trans>Sending</Trans>
            </div>
          ) : (
            <div
              className="token-dialog-comfirm"
              onClick={() => {
                this.handleComfirm();
              }}
              style={{ left: "180px", top: "430px" }}
            >
              <Trans>Confirm</Trans>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default FeedbackDialog;
