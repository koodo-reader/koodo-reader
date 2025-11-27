import React from "react";
import "./supportDialog.css";
import { SupporDialogProps, SupporDialogState } from "./interface";
import { Trans } from "react-i18next";
import Lottie from "react-lottie";
import supportAnimation from "../../../assets/lotties/support.json";
import exitAnimation from "../../../assets/lotties/exit.json";
import {
  getWebsiteUrl,
  handleContextMenu,
  openInBrowser,
} from "../../../utils/common";
import {
  ConfigService,
  TokenService,
} from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import { handleExitApp } from "../../../utils/request/common";
import {
  fetchUserInfo,
  getTempToken,
  getUserRequest,
} from "../../../utils/request/user";
const newOptions = {
  loop: true,
  autoplay: true,
  animationData: supportAnimation,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};
const exitOptions = {
  loop: true,
  autoplay: true,
  animationData: exitAnimation,
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
    this.state = {
      isRedeemCode: false,
      isExitPro: false,
      redeemCode: "",
    };
  }

  handleClose = () => {
    this.props.handleShowSupport(false);
  };

  render() {
    return (
      <>
        {this.props.isAuthed && this.props.isShowSupport && (
          <div className="new-version">
            {this.state.isExitPro ? (
              <>
                <div className="new-version-title">
                  <Trans>Exit Pro</Trans>
                </div>
                <>
                  <div className="support-us-out-button" style={{}}>
                    <div
                      onClick={async () => {
                        await TokenService.deleteToken("is_authed");
                        await TokenService.deleteToken("access_token");
                        await TokenService.deleteToken("refresh_token");
                        ConfigService.removeItem("defaultSyncOption");
                        ConfigService.removeItem("dataSourceList");
                        this.props.handleFetchAuthed();
                        this.props.handleFetchDataSourceList();
                        this.props.handleFetchDefaultSyncOption();
                        this.props.handleLoginOptionList([]);
                        toast.success(this.props.t("Log out successful"));
                        this.handleClose();
                        this.setState({ isExitPro: false });
                      }}
                      className="support-us-need-help"
                      style={{ marginRight: 10 }}
                    >
                      {this.props.t("Still refuse")}
                    </div>
                  </div>
                  <div
                    className="support-us-info"
                    style={{ height: 380, overflowY: "scroll" }}
                  >
                    <div className="new-version-animation">
                      <div
                        className="new-version-animation"
                        style={{ marginLeft: 20 }}
                      >
                        <Lottie
                          options={exitOptions}
                          height={180}
                          width={220}
                        />
                      </div>
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
                          this.setState({ isExitPro: false });
                        }}
                        style={{ fontWeight: "bold" }}
                      >
                        <Trans>I'll think about it</Trans>
                      </div>
                    </div>
                    <p
                      className="update-dialog-new-title"
                      style={{
                        textAlign: "center",
                        margin: 20,
                        marginLeft: 0,
                        marginRight: 0,
                      }}
                    >
                      {this.props.t(
                        "Once you exit the Pro version, you will no longer be able to use synchronization and other premium features"
                      )}
                    </p>
                    <p
                      className="support-dialog-list"
                      style={{
                        textAlign: "center",
                        lineHeight: "1.5",
                        marginTop: 10,
                      }}
                    >
                      {this.props.t(
                        "In the future, we will introduce more member-exclusive features, including reading statistics and automatic synchronization of your notes, highlights, reading progress, and vocabulary lists to platforms like Notion, Obsidian, Logseq, Anki, and more."
                      )}
                    </p>
                  </div>
                </>
              </>
            ) : (
              <>
                <div className="new-version-title">
                  <Trans>Your trial period has expired</Trans>
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: "rgb(231, 69, 69)",
                    position: "absolute",
                    left: 20,
                    bottom: 20,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    this.setState({ isRedeemCode: true });
                  }}
                >
                  <Trans>Redeem</Trans>
                </div>
                {this.state.isRedeemCode ? (
                  <div
                    className="voice-add-new-container"
                    style={{
                      marginLeft: "25px",
                      marginTop: "20px",
                      width: "calc(100% - 50px)",
                      fontWeight: 500,
                    }}
                  >
                    <input
                      type={"text"}
                      name={"redeemCode"}
                      placeholder={this.props.t("Enter your redemption code")}
                      onChange={(e) => {
                        if (e.target.value) {
                          this.setState({
                            redeemCode: e.target.value.trim().toUpperCase(),
                          });
                        }
                      }}
                      onContextMenu={() => {
                        handleContextMenu("token-dialog-redeem-code-box", true);
                      }}
                      id={"token-dialog-redeem-code-box"}
                      className="token-dialog-username-box"
                      style={{ height: "35px" }}
                    />
                    <div className="token-dialog-button-container">
                      <div
                        className="voice-add-confirm"
                        onClick={async () => {
                          toast.loading(this.props.t("Verifying..."), {
                            id: "redeem-code",
                          });
                          let userRequest = await getUserRequest();
                          let response = await userRequest.redeemCode({
                            code: this.state.redeemCode,
                          });
                          if (response.code === 200) {
                            this.props.handleFetchUserInfo();
                            let userRequest = await getUserRequest();
                            await userRequest.refreshUserToken();
                            toast.success(this.props.t("Redeem successful"), {
                              id: "redeem-code",
                            });

                            this.setState({ isRedeemCode: false });
                            this.props.handleShowSupport(false);
                          } else if (response.code === 401) {
                            toast.error(
                              this.props.t("Redeem failed, error code") +
                                ": " +
                                response.msg,
                              {
                                id: "redeem-code",
                              }
                            );
                            handleExitApp();
                            return;
                          } else {
                            toast.error(
                              this.props.t("Redeem failed, error code") +
                                ": " +
                                response.msg,
                              {
                                id: "redeem-code",
                              }
                            );
                          }
                        }}
                      >
                        <Trans>Redeem</Trans>
                      </div>
                      <div className="voice-add-button-container">
                        <div
                          className="voice-add-cancel"
                          onClick={() => {
                            this.setState({ isRedeemCode: false });
                          }}
                        >
                          <Trans>Cancel</Trans>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="support-us-out-button" style={{}}>
                      <div
                        onClick={async () => {
                          this.setState({ isExitPro: true });
                        }}
                        className="support-us-need-help"
                      >
                        {this.props.t("Exit Pro")}
                      </div>
                      <div
                        onClick={async () => {
                          toast.loading(
                            this.props.t("Checking payment status"),
                            {
                              id: "check-payment-status",
                            }
                          );
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
                              this.props.handleFetchUserInfo();
                              let userRequest = await getUserRequest();
                              await userRequest.refreshUserToken();
                              toast.success(
                                this.props.t("Thanks for your support"),
                                {
                                  id: "check-payment-status",
                                }
                              );

                              this.props.handleShowSupport(false);
                            }
                          } else {
                            toast.error(
                              this.props.t("Failed to get user info")
                            );
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
                            toast.loading(
                              this.props.t("Generating payment link"),
                              {
                                id: "generate-payment-link",
                              }
                            );
                            let response = await getTempToken();
                            if (response.code === 200) {
                              toast.dismiss("generate-payment-link");
                              let tempToken = response.data.access_token;
                              let deviceUuid =
                                await TokenService.getFingerprint();
                              openInBrowser(
                                getWebsiteUrl() +
                                  (ConfigService.getReaderConfig(
                                    "lang"
                                  ).startsWith("zh")
                                    ? "/zh"
                                    : "/en") +
                                  "/pricing?temp_token=" +
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
                          "For just the price of a cup of coffee per year, you can continue to enjoy the premium features and support our development"
                        )}
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </>
    );
  }
}

export default SupporDialog;
