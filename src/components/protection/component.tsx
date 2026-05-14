import React from "react";
import "./protection.css";
import { TokenService } from "../../assets/lib/kookit-extra-browser.min";
import { verifyPassword, verifyPin } from "../../utils/protectionUtil";
import { vexPasswordInputAsync } from "../../utils/common";
import toast from "react-hot-toast";
import i18n from "../../i18n";
import { Trans } from "react-i18next";

interface ProtectionOverlayState {
  isVisible: boolean;
  method: string;
  pinValue: string;
  pinError: boolean;
}

class ProtectionOverlay extends React.Component<{}, ProtectionOverlayState> {
  private pinResolve: ((pin: string) => void) | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      isVisible: false,
      method: "",
      pinValue: "",
      pinError: false,
    };
  }

  async componentDidMount() {
    const method = (await TokenService.getToken("protection_method")) || "";
    if (method) {
      this.setState({ isVisible: true, method }, () => {
        if (method !== "pin") {
          this.startPasswordAuth();
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
          i18n.t("Enter password to unlock the app")
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
    const { isVisible, method, pinValue, pinError } = this.state;
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
                  return <span key={idx} className="pin-key pin-key-empty" />;
                }
                if (d === "del") {
                  return (
                    <button
                      key={idx}
                      className="pin-key pin-key-del"
                      onClick={this.handlePinDelete}
                    >
                      ⌫
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

    return <div className="protection-overlay" />;
  }
}

export default ProtectionOverlay;
