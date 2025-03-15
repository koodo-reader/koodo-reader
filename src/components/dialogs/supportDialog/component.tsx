import React from "react";
import "./supportDialog.css";
import { SupporDialogProps, SupporDialogState } from "./interface";
import { Trans } from "react-i18next";
import Lottie from "react-lottie";
import packageInfo from "../../../../package.json";
import animation from "../../../assets/lotties/support.json";
import { openExternalUrl, sleep, WEBSITE_URL } from "../../../utils/common";
import {
  ConfigService,
  TokenService,
} from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import { isElectron } from "react-device-detect";
import { checkStableUpdate } from "../../../utils/request/common";
import { fetchUserInfo, getTempToken } from "../../../utils/request/user";
const newOptions = {
  loop: true,
  autoplay: true,
  animationData: animation,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};

class SupporDialog extends React.Component<
  SupporDialogProps,
  SupporDialogState
> {
  constructor(props: SupporDialogProps) {
    super(props);
    this.state = {};
  }
  componentDidMount() {
    if (isElectron) {
      checkStableUpdate().then(async (res) => {
        const newVersion = res.version;
        await sleep(500);
        if (packageInfo.version.localeCompare(newVersion) >= 0) {
          this.props.handleFetchUserInfo();
        }
      });
    } else {
      this.props.handleFetchUserInfo();
    }
  }

  handleClose = () => {
    this.props.handleShowSupport(false);
  };

  render() {
    return (
      <>
        {this.props.isAuthed && this.props.isShowSupport && (
          <div className="new-version">
            <div className="new-version-title">
              <Trans>Your trial period has expired</Trans>
            </div>
            <div className="support-us-out-button" style={{}}>
              <div
                onClick={async () => {
                  await TokenService.deleteToken("is_authed");
                  await TokenService.deleteToken("access_token");
                  await TokenService.deleteToken("refresh_token");
                  ConfigService.removeItem("defaultSyncOption");
                  ConfigService.removeItem("dataSourceList");
                  this.props.handleFetchAuthed();
                  toast.success(this.props.t("Log out successful"));
                  this.handleClose();
                }}
                className="support-us-need-help"
              >
                {this.props.t("Exit Pro")}
              </div>
              <div
                onClick={async () => {
                  toast.loading(this.props.t("Checking payment status"), {
                    id: "check-payment-status",
                  });
                  let res = await fetchUserInfo();
                  if (res.code === 200) {
                    let userInfo = res.data;
                    if (
                      userInfo.valid_until <
                      parseInt(new Date().getTime() / 1000 + "")
                    ) {
                      toast.error(
                        this.props.t("You haven't upgraded to Pro yet"),
                        {
                          id: "check-payment-status",
                        }
                      );
                    } else {
                      toast.success(this.props.t("Thanks for your support"), {
                        id: "check-payment-status",
                      });
                      this.props.handleShowSupport(false);
                    }
                  } else {
                    toast.error(this.props.t("Failed to get user info"));
                  }
                }}
                className="support-us-need-help"
                style={{ marginRight: 10 }}
              >
                {this.props.t("I've paid")}
              </div>
            </div>
            <div className="support-us-info" style={{ height: 420 }}>
              <div className="new-version-animation">
                <Lottie options={newOptions} height={200} width={320} />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  margin: 20,
                }}
              >
                <div
                  className="new-version-open"
                  onClick={async () => {
                    toast.loading(this.props.t("Generating payment link"), {
                      id: "generate-payment-link",
                    });
                    let response = await getTempToken();
                    if (response.code === 200) {
                      toast.dismiss("generate-payment-link");
                      let tempToken = response.data.access_token;
                      let deviceUuid = await TokenService.getFingerprint();
                      openExternalUrl(
                        WEBSITE_URL +
                          "/en/pricing?temp_token=" +
                          tempToken +
                          "&device_uuid=" +
                          deviceUuid
                      );
                    } else if (response.code === 401) {
                      this.props.handleFetchAuthed();
                    }
                  }}
                  style={{ fontWeight: "bold" }}
                >
                  <Trans>Upgrade</Trans>
                </div>
              </div>
              <p
                className="update-dialog-new-title"
                style={{ textAlign: "center", marginLeft: 0 }}
              >
                <Trans>Please support our development</Trans>
              </p>
              <p
                className="support-dialog-list"
                style={{ textAlign: "center", lineHeight: "1.5" }}
              >
                {this.props.t(
                  "For just the price of a takeout meal each year, you can continue to enjoy the premium features and support our development"
                )}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default SupporDialog;
