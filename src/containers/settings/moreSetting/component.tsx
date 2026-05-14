import React from "react";
import { Trans } from "react-i18next";
import { MoreSettingProps, MoreSettingState } from "./interface";
import toast from "react-hot-toast";
import { isElectron } from "react-device-detect";
import { TokenService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  clearProtection,
  verifyPassword,
  verifyPin,
  verifyBiometric,
  setProtectionPassword,
  setProtectionPin,
  setProtectionBiometric,
} from "../../../utils/protectionUtil";
import { vexPasswordInputAsync, vexSelectAsync } from "../../../utils/common";
import i18n from "../../../i18n";

class MoreSetting extends React.Component<MoreSettingProps, MoreSettingState> {
  constructor(props: MoreSettingProps) {
    super(props);
    this.state = {
      protectionMethod: "",
      isLoading: true,
    };
  }

  async componentDidMount() {
    const method = (await TokenService.getToken("protection_method")) || "";
    this.setState({ protectionMethod: method, isLoading: false });
  }

  verifyCurrentMethod = async (): Promise<boolean> => {
    const { protectionMethod } = this.state;
    if (protectionMethod === "password") {
      const input = await vexPasswordInputAsync(
        i18n.t("Enter your current password")
      );
      if (!input) return false;
      const ok = await verifyPassword(input as string);
      if (!ok) toast.error(this.props.t("Incorrect password"));
      return ok;
    } else if (protectionMethod === "pin") {
      const input = await vexPasswordInputAsync(
        i18n.t("Enter your current PIN")
      );
      if (!input) return false;
      const ok = await verifyPin(input as string);
      if (!ok) toast.error(this.props.t("Incorrect PIN"));
      return ok;
    } else if (protectionMethod === "biometric") {
      const ok = await verifyBiometric();
      if (!ok) toast.error(this.props.t("Biometric authentication failed"));
      return ok;
    }
    return true;
  };

  handleToggleProtection = async () => {
    const { protectionMethod } = this.state;
    if (protectionMethod) {
      // Disable: verify first, then clear
      const verified = await this.verifyCurrentMethod();
      if (!verified) return;
      await clearProtection();
      this.setState({ protectionMethod: "" });
      toast.success(this.props.t("Change successful"));
    } else {
      // Enable: pick a method
      const methodOptions: { value: string; label: string }[] = [
        { value: "password", label: "Password" },
        { value: "pin", label: "PIN" },
      ];
      if (isElectron) {
        methodOptions.push({ value: "biometric", label: "Biometric" });
      }
      const method = await vexSelectAsync(
        "Select protection method",
        methodOptions
      );
      if (!method) return;
      await this.setupMethod(method as string);
    }
  };

  handleChangeMethod = async (newMethod: string) => {
    const { protectionMethod } = this.state;
    if (newMethod === protectionMethod) return;
    // Verify current method first
    const verified = await this.verifyCurrentMethod();
    if (!verified) return;
    await this.setupMethod(newMethod);
  };

  setupMethod = async (method: string) => {
    if (method === "password") {
      const input = await vexPasswordInputAsync(
        i18n.t("Enter new password"),
        i18n.t("Confirm new password")
      );
      if (input === false) {
        toast.error(this.props.t("Passwords do not match or input is empty"));
        return;
      }
      await setProtectionPassword(input as string);
      this.setState({ protectionMethod: "password" });
      toast.success(this.props.t("Change successful"));
    } else if (method === "pin") {
      const input = await vexPasswordInputAsync(
        i18n.t("Enter new 6-digit PIN"),
        i18n.t("Confirm new 6-digit PIN")
      );
      if (input === false) {
        toast.error(this.props.t("PINs do not match or input is empty"));
        return;
      }
      if (!/^\d{6}$/.test(input as string)) {
        toast.error(this.props.t("PIN must be exactly 6 digits"));
        return;
      }
      await setProtectionPin(input as string);
      this.setState({ protectionMethod: "pin" });
      toast.success(this.props.t("Change successful"));
    } else if (method === "biometric") {
      if (!isElectron) {
        toast.error(
          this.props.t("Biometric is only available in the desktop version")
        );
        return;
      }
      const ok = await setProtectionBiometric();
      if (!ok) {
        toast.error(this.props.t("Biometric authentication failed"));
        return;
      }
      this.setState({ protectionMethod: "biometric" });
      toast.success(this.props.t("Change successful"));
    }
  };

  render() {
    const { protectionMethod, isLoading } = this.state;
    const isEnabled = !!protectionMethod;

    if (isLoading) {
      return null;
    }

    return (
      <>
        <div className="setting-dialog-new-title" key="protection-toggle">
          <span style={{ width: "calc(100% - 100px)" }}>
            <Trans>Enable software protection</Trans>
          </span>
          <span
            className="single-control-switch"
            onClick={this.handleToggleProtection}
            style={isEnabled ? {} : { opacity: 0.6 }}
          >
            <span
              className="single-control-button"
              style={
                isEnabled
                  ? {
                      transform: "translateX(20px)",
                      transition: "transform 0.5s ease",
                    }
                  : {
                      transform: "translateX(0px)",
                      transition: "transform 0.5s ease",
                    }
              }
            />
          </span>
        </div>
        <p className="setting-option-subtitle">
          <Trans>
            When enabled, the app will require authentication on every launch
          </Trans>
        </p>

        {isEnabled && (
          <>
            <div className="setting-dialog-new-title" key="protection-method">
              <Trans>Protection method</Trans>
              <select
                className="lang-setting-dropdown"
                value={protectionMethod}
                onChange={(e) => this.handleChangeMethod(e.target.value)}
              >
                <option value="password">{this.props.t("Password")}</option>
                <option value="pin">{this.props.t("PIN")}</option>
                {isElectron && (
                  <option value="biometric">{this.props.t("Biometric")}</option>
                )}
              </select>
            </div>
            <p className="setting-option-subtitle">
              {protectionMethod === "password" && (
                <Trans>Use a custom password to protect the app</Trans>
              )}
              {protectionMethod === "pin" && (
                <Trans>Use a 6-digit PIN to protect the app</Trans>
              )}
              {protectionMethod === "biometric" && (
                <Trans>
                  Use biometric authentication (Touch ID / Windows Hello) to
                  protect the app
                </Trans>
              )}
            </p>
          </>
        )}
      </>
    );
  }
}

export default MoreSetting;
