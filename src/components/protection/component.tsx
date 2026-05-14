import React from "react";
import "./protection.css";
import { TokenService } from "../../assets/lib/kookit-extra-browser.min";
import {
  verifyPassword,
  verifyPin,
  verifyBiometric,
} from "../../utils/protectionUtil";
import { vexPasswordInputAsync } from "../../utils/common";
import toast from "react-hot-toast";
import i18n from "../../i18n";

interface ProtectionOverlayState {
  isVisible: boolean;
  method: string;
}

class ProtectionOverlay extends React.Component<{}, ProtectionOverlayState> {
  private isAuthenticating = false;

  constructor(props: {}) {
    super(props);
    this.state = {
      isVisible: false,
      method: "",
    };
  }

  async componentDidMount() {
    const method = (await TokenService.getToken("protection_method")) || "";
    if (method) {
      this.setState({ isVisible: true, method }, () => {
        this.startAuth();
      });
    }
  }

  startAuth = async () => {
    if (this.isAuthenticating) return;
    this.isAuthenticating = true;

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
      } else if (method === "pin") {
        const input = await vexPasswordInputAsync(
          i18n.t("Enter PIN to unlock the app")
        );
        if (!input) {
          toast.error(i18n.t("Authentication required to access the app"));
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        success = await verifyPin(input as string);
        if (!success) toast.error(i18n.t("Incorrect PIN, please try again"));
      } else if (method === "biometric") {
        success = await verifyBiometric();
        if (!success) {
          toast.error(
            i18n.t("Biometric authentication failed, please try again")
          );
          await new Promise((r) => setTimeout(r, 1000));
        }
      } else {
        success = true;
      }
    }

    this.isAuthenticating = false;
    this.setState({ isVisible: false });
  };

  render() {
    if (!this.state.isVisible) return null;
    return <div className="protection-overlay" />;
  }
}

export default ProtectionOverlay;
