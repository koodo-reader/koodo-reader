import React, { Component } from "react";
import { Trans } from "react-i18next";
import { FeedbackDialogProps, FeedbackDialogState } from "./interface";
import toast from "react-hot-toast";
import "./feedbackDialog.css";
import packageInfo from "../../../../package.json";
import { openExternalUrl } from "../../../utils/common";
import JSZip from "jszip";
import {
  checkDeveloperUpdate,
  getUploadUrl,
  sendFeedback,
  uploadFile,
} from "../../../utils/request/common";
declare var window: any;
class FeedbackDialog extends Component<
  FeedbackDialogProps,
  FeedbackDialogState
> {
  constructor(props: FeedbackDialogProps) {
    super(props);
    this.state = {
      isNew: false,
      developerVersion: "1.0.0",
      isSending: false,
      uploadUrl: "",
      fileContent: null,
    };
  }
  async componentDidMount() {
    let version = (await checkDeveloperUpdate()).version.substr(1);
    this.setState({ developerVersion: version });
    let url = await getUploadUrl();
    this.setState({ uploadUrl: url });
  }
  handleCancel = () => {
    this.props.handleFeedbackDialog(false);
  };

  handleComfirm = async () => {
    this.setState({ isSending: true });

    let uploadResult = true;
    if (this.state.fileContent && this.state.uploadUrl) {
      uploadResult = await uploadFile(
        this.state.uploadUrl,
        this.state.fileContent
      );
    }
    if (!uploadResult) {
      toast.error(this.props.t("Error happened"));
      this.setState({ isSending: false });
      return;
    }
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
    if (subject === "") {
      toast(this.props.t("Subject can't be empty"));
      this.setState({ isSending: false });
      return;
    }
    toast(this.props.t("Sending"));
    let version = packageInfo.version;
    const os = window.require("os");
    const system = os.platform() + " " + os.version();
    let fileName = "";
    if (this.state.fileContent && this.state.uploadUrl) {
      var segments = this.state.uploadUrl.split("/").reverse()[0];
      fileName = segments.split("?")[0];
    }
    let data = JSON.stringify({
      version,
      os: system,
      subject,
      content,
      email,
      assets: fileName,
    });
    let result = await sendFeedback(data);

    if (result !== "ok") {
      toast.error(this.props.t("Error happened"));
      this.setState({ isSending: false });
      return;
    }
    toast.success(this.props.t("Sending successful"));
    this.props.handleFeedbackDialog(false);
  };
  handleJump = (url: string) => {
    openExternalUrl(url);
  };
  getFileName(url: string) {
    var regex = /([^?]+)(?=\?|$)/;
    var match = url.match(regex);

    if (match) {
      return match[1];
    } else {
      return "";
    }
  }
  render() {
    return (
      <div className="feedback-dialog-container">
        <div className="feedback-dialog-box">
          <div className="feedback-dialog-title">
            <Trans>Report</Trans>
          </div>
          <div className="feedback-dialog-info-text">
            <Trans>
              Thanks for using the developer version, leave a comment if you
              encounter any problems. Note that we can't reply to you from here.
              For faster and better support, please visit
            </Trans>
            &nbsp;
            <span
              onClick={() => {
                this.handleJump(`https://koodoreader.com/en/support`);
              }}
              style={{ color: "rgb(35, 170, 242)", cursor: "pointer" }}
            >
              <Trans>Our website</Trans>
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
                update first
              </Trans>
              &nbsp;
              <span
                onClick={() => {
                  this.handleJump(`https://dl.koodoreader.com/latest.html`);
                }}
                style={{ color: "rgb(35, 170, 242)", cursor: "pointer" }}
              >
                <Trans>Download</Trans>
              </span>
            </div>
          )}

          <>
            <textarea
              name="subject"
              placeholder={this.props.t("Brief description of the problem")}
              id="feedback-dialog-subject-box"
              className="feedback-dialog-content-box"
              style={
                packageInfo.version.localeCompare(this.state.developerVersion) <
                0
                  ? {}
                  : { marginTop: "30px" }
              }
            />
            <div className="feedback-dialog-file-container">
              <div className="feedback-dialog-file-text">
                <Trans>Upload attachments</Trans>
              </div>
              <div></div>
              <input
                type="file"
                multiple={true}
                id="feedback-file-box"
                name="file"
                className="feedback-file-box"
                onChange={(event) => {
                  if (!event || !event.target || !event.target.files) {
                    toast.error("Empty files");
                  }
                  let files: any = event.target.files;
                  let zip = new JSZip();
                  for (let index = 0; index < files.length; index++) {
                    const file = files[index];
                    var fileSize = file.size;
                    var fileSizeMB = fileSize / (1024 * 1024);
                    if (fileSizeMB > 20) {
                      toast.error(
                        this.props.t("File size is larger than 20MB")
                      );
                      event.target.value = "";
                      break;
                    } else {
                      zip.file(file.name, file);
                    }
                  }
                  zip.generateAsync({ type: "blob" }).then((content) => {
                    this.setState({ fileContent: content });
                  });
                }}
              />
            </div>

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
          <div className="add-dialog-button-container">
            <div
              className="add-dialog-cancel"
              onClick={() => {
                this.handleCancel();
              }}
              style={{ left: "100px", top: "440px" }}
            >
              <Trans>Cancel</Trans>
            </div>
            {this.state.isSending ? (
              <div
                className="add-dialog-confirm"
                style={{ left: "180px", top: "440px" }}
              >
                <Trans>Sending</Trans>
              </div>
            ) : (
              <div
                className="add-dialog-confirm"
                onClick={() => {
                  this.handleComfirm();
                }}
                style={{ left: "180px", top: "440px" }}
              >
                <Trans>Confirm</Trans>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default FeedbackDialog;
