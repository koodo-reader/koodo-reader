import { useState } from "react";
import "./supportDialog.css";
import { SupportDialogProps, SupportDialogState } from "./interface";
import { Trans } from "react-i18next";
import Lottie from "lottie-react";
import supportAnimation from "../../../assets/lotties/support.json";
import exitAnimation from "../../../assets/lotties/exit.json";
import {
  getServerRegion,
  getWebsiteLang,
  getWebsiteUrl,
  handleContextMenu,
  openInBrowser,
} from "../../../utils/common";
import toast from "react-hot-toast";
import { handleClearToken, handleExitApp } from "../../../utils/request/common";
import {
  fetchUserInfo,
  getTempToken,
  getUserRequest,
} from "../../../utils/request/user";
import TokenService from "../../../utils/storage/tokenService";
import { proFeatures } from "../../../constants/loginList";

const SupportDialog = (props: SupportDialogProps) => {
  const [state, setState] = useState<SupportDialogState>({
    isRedeemCode: false,
    isExitPro: false,
    redeemCode: "",
  });

  const handleClose = () => {
    props.handleShowSupport(false);
  };

  return (
    <>
      {props.isAuthed && props.isShowSupport && (
        <div className="new-version">
          {state.isExitPro ? (
            <>
              <div className="new-version-title">
                <Trans>Exit Pro</Trans>
              </div>
              <>
                <div className="support-us-out-button" style={{}}>
                  <div
                    onClick={async () => {
                      await handleClearToken();
                      props.handleFetchAuthed();
                      props.handleFetchDataSourceList();
                      props.handleFetchDefaultSyncOption();
                      props.handleLoginOptionList([]);
                      props.handleShowSupport(false);
                      toast.success(props.t("Log out successful"));
                      handleClose();
                      setState((prev) => ({ ...prev, isExitPro: false }));
                    }}
                    className="support-us-need-help"
                    style={{ marginRight: 10 }}
                  >
                    {props.t("Still refuse")}
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
                        animationData={exitAnimation}
                        loop={true}
                        style={{ height: 180, width: "100%" }}
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
                        setState((prev) => ({ ...prev, isExitPro: false }));
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
                    {props.t(
                      "Once you exit the Pro version, you will no longer be able to use synchronization and other premium features"
                    )}
                  </p>
                  <ul className="support-dialog-benefit-list">
                    {proFeatures.map((feature, index) => (
                      <li key={index}>{props.t(feature)}</li>
                    ))}
                  </ul>
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
                  setState((prev) => ({ ...prev, isRedeemCode: true }));
                }}
              >
                <Trans>Redeem</Trans>
              </div>
              {state.isRedeemCode ? (
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
                    placeholder={props.t("Enter your redemption code")}
                    onChange={(e) => {
                      if (e.target.value) {
                        setState((prev) => ({
                          ...prev,
                          redeemCode: e.target.value.trim().toUpperCase(),
                        }));
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
                        toast.loading(props.t("Verifying..."), {
                          id: "redeem-code",
                        });
                        let userRequest = await getUserRequest();
                        let response = await userRequest.redeemCode({
                          code: state.redeemCode,
                        });
                        if (response.code === 200) {
                          props.handleFetchUserInfo();
                          toast.success(props.t("Redeem successful"), {
                            id: "redeem-code",
                          });

                          setState((prev) => ({
                            ...prev,
                            isRedeemCode: false,
                          }));
                          props.handleShowSupport(false);
                        } else if (response.code === 401) {
                          toast.error(
                            props.t("Redeem failed, error code") +
                              ": " +
                              response.msg,
                            {
                              id: "redeem-code",
                            }
                          );
                          handleExitApp();
                          return;
                        } else if (response.code === 10010) {
                          toast.error(
                            props.t(
                              "This code has already been used, if you have redeemed it before, there is no need to redeem it again. Just log in to same account to use Pro features"
                            ),
                            {
                              id: "redeem-code",
                              duration: 6000,
                            }
                          );
                        } else {
                          toast.error(
                            props.t("Redeem failed, error code") +
                              ": " +
                              response.msg,
                            {
                              id: "redeem-code",
                            }
                          );
                          if (response.code === 10009) {
                            if (state.redeemCode.startsWith("CD")) {
                              toast(
                                props.t(
                                  "This is the order number not the redemption code, please check your email again, the redemption code is below the order number"
                                ),
                                {
                                  duration: 8000,
                                }
                              );
                            } else {
                              toast(
                                props.t(
                                  "Please make sure you entered the correct redemption code and the code matches your server region, if you have any questions, please contact our support team"
                                ),
                                {
                                  duration: 8000,
                                }
                              );
                            }
                          }
                        }
                      }}
                    >
                      <Trans>Redeem</Trans>
                    </div>
                    <div className="voice-add-button-container">
                      <div
                        className="voice-add-cancel"
                        onClick={() => {
                          setState((prev) => ({
                            ...prev,
                            isRedeemCode: false,
                          }));
                        }}
                      >
                        <Trans>Cancel</Trans>
                      </div>
                    </div>
                  </div>
                  <p
                    className="support-dialog-list"
                    style={{
                      textAlign: "left",
                      lineHeight: "1.5",
                      margin: 0,
                      fontSize: 14,
                    }}
                  >
                    {props.t(
                      "Redemption code has been sent to the email address you provided during checkout. If you haven't received the code, please check the spam foler or contact our support team for assistance."
                    )}
                  </p>
                </div>
              ) : (
                <>
                  <div className="support-us-out-button" style={{}}>
                    <div
                      onClick={async () => {
                        setState((prev) => ({ ...prev, isExitPro: true }));
                      }}
                      className="support-us-need-help"
                      style={{ marginRight: 10 }}
                    >
                      {props.t("Exit Pro")}
                    </div>
                    <div
                      onClick={async () => {
                        toast.loading(props.t("Checking payment status"), {
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
                              props.t("You haven't upgraded to Pro yet") +
                                "\n" +
                                props.t(
                                  "If you purchased a redemption code, please click the redeem button to redeem it, or contact our support team for assistance"
                                ),
                              {
                                id: "check-payment-status",
                                duration: 6000,
                              }
                            );
                          } else {
                            props.handleFetchUserInfo();
                            toast.success(props.t("Thanks for your support"), {
                              id: "check-payment-status",
                            });

                            props.handleShowSupport(false);
                          }
                        } else {
                          toast.error(props.t("Failed to get user info"));
                        }
                      }}
                      className="support-us-need-help"
                      style={{ marginRight: 10, marginLeft: 10 }}
                    >
                      {props.t("I've paid")}
                    </div>
                  </div>
                  <div className="support-us-info" style={{ height: 420 }}>
                    <div className="new-version-animation">
                      <Lottie
                        animationData={supportAnimation}
                        loop={true}
                        style={{ height: 200, width: "100%" }}
                      />
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
                          toast.loading(props.t("Generating payment link"), {
                            id: "generate-payment-link",
                          });
                          let response = await getTempToken();
                          if (response.code === 200) {
                            toast.dismiss("generate-payment-link");
                            let tempToken = response.data.access_token;
                            let deviceUuid =
                              await TokenService.getFingerprint();
                            openInBrowser(
                              getWebsiteUrl() +
                                getWebsiteLang() +
                                "/pricing?temp_token=" +
                                tempToken +
                                "&device_uuid=" +
                                deviceUuid
                            );
                          } else if (response.code === 401) {
                            props.handleFetchAuthed();
                          }
                        }}
                        style={{ fontWeight: "bold" }}
                      >
                        {getServerRegion() === "global" ? (
                          <Trans>Upgrade</Trans>
                        ) : (
                          <Trans>Purchase the code</Trans>
                        )}
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
                      {props.t(
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
};

export default SupportDialog;
