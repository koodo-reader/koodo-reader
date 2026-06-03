import React from "react";
import "./protection.css";
import { TokenService } from "../../assets/lib/kookit-extra-browser.min";
import {
  getBiometricErrorMessage,
  promptBiometricAuth,
  verifyPassword,
  verifyPin,
} from "../../utils/protectionUtil";
import { vexPasswordInputAsync } from "../../utils/common";
import toast from "react-hot-toast";
import i18n from "../../i18n";
import { Trans } from "react-i18next";

interface ProtectionOverlayState {
  isVisible: boolean;
  method: string;
  pinValue: string;
  pinError: boolean;
  biometricError: string;
  isAuthenticating: boolean;
}

// Track whether the startup auth check has already been performed in this session
let _hasCheckedOnStartup = false;

class ProtectionOverlay extends React.Component<{}, ProtectionOverlayState> {
  private pinResolve: ((pin: string) => void) | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      isVisible: false,
      method: "",
      pinValue: "",
      pinError: false,
      biometricError: "",
      isAuthenticating: false,
    };
  }

  async componentDidMount() {
    if (_hasCheckedOnStartup) return;
    _hasCheckedOnStartup = true;
    const method = (await TokenService.getToken("protection_method")) || "";
    if (method) {
      this.setState({ isVisible: true, method }, () => {
        if (method === "password") {
          this.startPasswordAuth();
        } else if (method === "biometric") {
          this.startBiometricAuth();
        }
      });
    }
  }

  startPasswordAuth = async () => {
    const { method } = this.state;
    let success = false;
    while (!success) {
      if (method === "password") {
        const input = await vexPasswordInputAsync(
          i18n.t("Enter password to unlock the app"),
          "",
          true
        );
        if (!input) {
          toast.error(i18n.t("Authentication required to access the app"));
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        success = await verifyPassword(input as string);
        if (!success)
          toast.error(i18n.t("Incorrect password, please try again"));
      } else {
        success = true;
      }
    }
    this.setState({ isVisible: false });
  };

  startBiometricAuth = async () => {
    if (this.state.isAuthenticating) return;

    this.setState({
      isAuthenticating: true,
      biometricError: "",
    });
    const result = await promptBiometricAuth(
      i18n.t("Authenticate to unlock the app")
    );
    if (result.success) {
      this.setState({ isVisible: false, isAuthenticating: false });
      return;
    }

    this.setState({
      isAuthenticating: false,
      biometricError: getBiometricErrorMessage(result.code, i18n.t.bind(i18n)),
    });
  };

  waitForPin = (): Promise<string> => {
    return new Promise((resolve) => {
      this.pinResolve = resolve;
    });
  };

  handlePinDigit = (digit: string) => {
    const { pinValue } = this.state;
    if (pinValue.length >= 6) return;
    const next = pinValue + digit;
    this.setState({ pinValue: next, pinError: false }, async () => {
      if (next.length === 6) {
        const ok = await verifyPin(next);
        if (ok) {
          this.setState({ isVisible: false });
        } else {
          this.setState({ pinValue: "", pinError: true });
        }
      }
    });
  };

  handlePinDelete = () => {
    this.setState((s) => ({
      pinValue: s.pinValue.slice(0, -1),
      pinError: false,
    }));
  };

  render() {
    const {
      isVisible,
      method,
      pinValue,
      pinError,
      biometricError,
      isAuthenticating,
    } = this.state;
    if (!isVisible) return null;

    if (method === "pin") {
      const digits: (number | "del" | null)[] = [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        null,
        0,
        "del",
      ];
      return (
        <div className="protection-overlay">
          <div className="pin-keypad-container">
            <div className="pin-keypad-title">
              {i18n.t("Enter PIN to unlock the app")}
            </div>
            {pinError && (
              <div className="pin-error-msg">
                <Trans>Incorrect PIN, please try again</Trans>
              </div>
            )}
            <div className="pin-dots">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={`pin-dot${i < pinValue.length ? " pin-dot-filled" : ""}`}
                />
              ))}
            </div>
            <div className="pin-keypad-grid">
              {digits.map((d, idx) => {
                if (d === null) {
                  return (
                    <span key={idx} className="pin-key pin-key-empty" />
                  );
                }
                if (d === "del") {
                  return (
                    <button
                      key={idx}
                      className="pin-key pin-key-empty"
                      onClick={this.handlePinDelete}
                    >
                      <span
                        className="icon-close"
                        style={{ fontSize: "18px" }}
                      ></span>
                    </button>
                  );
                }
                return (
                  <button
                    key={idx}
                    className="pin-key"
                    onClick={() => this.handlePinDigit(String(d))}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (method === "biometric") {
      return (
        <div className="protection-overlay">
          <div className="biometric-auth-container">
            <div className="pin-keypad-title">
              {i18n.t("Use biometric authentication to unlock the app")}
            </div>
            {biometricError && (
              <div className="pin-error-msg">{biometricError}</div>
            )}
            <button
              className="biometric-auth-button"
              onClick={this.startBiometricAuth}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <Trans>Authenticating with biometrics...</Trans>
              ) : (
                <Trans>Verify with biometrics</Trans>
              )}
            </button>
          </div>
        </div>
      );
    }

    return <div className="protection-overlay" />;
  }
}

export default ProtectionOverlay;
