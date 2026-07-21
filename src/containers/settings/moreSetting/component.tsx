import React from "react";
import { Trans } from "react-i18next";
import { MoreSettingProps, MoreSettingState } from "./interface";
import toast from "react-hot-toast";
import { TokenService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  clearProtection,
  getBiometricCapability,
  getBiometricErrorMessage,
  promptBiometricAuth,
  setProtectionBiometric,
  verifyPassword,
  verifyPin,
  setProtectionPassword,
  setProtectionPin,
} from "../../../utils/reader/protectionUtil";
import { vexPasswordInputAsync, vexSelectAsync } from "../../../utils/common";
import i18n from "../../../i18n";
import { isElectron } from "react-device-detect";

class MoreSetting extends React.Component<MoreSettingProps, MoreSettingState> {
  constructor(props: MoreSettingProps) {
    super(props);
    this.state = {
      protectionMethod: "",
      biometricAvailable: false,
      pinInputMode: "none",
      pinValue: "",
      pinFirstValue: "",
      pinCallback: null,
      proxyEnabled: false,
      proxyType: "none",
      proxyHost: "",
      proxyPort: "",
      proxyUsername: "",
      proxyPassword: "",
      isTestingProxy: false,
      proxyEditing: false,
    };
  }

  componentDidMount() {
    Promise.all([
      TokenService.getToken("protection_method"),
      getBiometricCapability(),
    ]).then(([method, biometricCapability]) => {
      this.setState({
        protectionMethod: method || "",
        biometricAvailable: biometricCapability.available,
      });
    });
    if (window.require) {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.invoke("get-proxy-config").then((cfg: any) => {
        if (!cfg) return;
        this.setState({
          proxyEnabled: cfg.enabled && cfg.type !== "none",
          proxyType: cfg.type || "none",
          proxyHost: cfg.host || "",
          proxyPort: cfg.port ? String(cfg.port) : "",
          proxyUsername: cfg.username || "",
          proxyPassword: cfg.password || "",
        });
      });
    }
  }

  showPinKeypad = (mode: "setup" | "verify"): Promise<string | false> => {
    return new Promise((resolve) => {
      this.setState({
        pinInputMode: mode === "setup" ? "setup-enter" : "verify",
        pinValue: "",
        pinFirstValue: "",
        pinCallback: resolve,
      });
    });
  };

  handlePinDigit = (digit: string) => {
    const { pinValue, pinInputMode, pinFirstValue, pinCallback } = this.state;
    if (pinValue.length >= 6) return;
    const next = pinValue + digit;
    this.setState({ pinValue: next }, async () => {
      if (next.length === 6) {
        if (pinInputMode === "setup-enter") {
          this.setState({
            pinInputMode: "setup-confirm",
            pinFirstValue: next,
            pinValue: "",
          });
        } else if (pinInputMode === "setup-confirm") {
          if (next === pinFirstValue) {
            this.setState({
              pinInputMode: "none",
              pinValue: "",
              pinFirstValue: "",
            });
            pinCallback && pinCallback(next);
          } else {
            toast.error(this.props.t("PINs do not match, please try again"));
            this.setState({
              pinValue: "",
              pinFirstValue: "",
              pinInputMode: "setup-enter",
            });
          }
        } else if (pinInputMode === "verify") {
          this.setState({ pinInputMode: "none", pinValue: "" });
          pinCallback && pinCallback(next);
        }
      }
    });
  };

  handlePinDelete = () => {
    this.setState((s) => ({ pinValue: s.pinValue.slice(0, -1) }));
  };

  handlePinCancel = () => {
    const { pinCallback } = this.state;
    this.setState({
      pinInputMode: "none",
      pinValue: "",
      pinFirstValue: "",
      pinCallback: null,
    });
    pinCallback && pinCallback(false);
  };

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
      const pin = await this.showPinKeypad("verify");
      if (pin === false) return false;
      const ok = await verifyPin(pin as string);
      if (!ok) toast.error(this.props.t("Incorrect PIN"));
      return ok;
    } else if (protectionMethod === "biometric") {
      const result = await promptBiometricAuth(
        i18n.t("Authenticate to change protection settings")
      );
      if (!result.success) {
        toast.error(getBiometricErrorMessage(result.code, this.props.t));
      }
      return result.success;
    }
    return true;
  };

  handleToggleProtection = async () => {
    const { protectionMethod, biometricAvailable } = this.state;
    if (protectionMethod) {
      const verified = await this.verifyCurrentMethod();
      if (!verified) return;
      await clearProtection();
      this.setState({ protectionMethod: "" });
      toast.success(this.props.t("Change successful"));
    } else {
      const methodOptions: { value: string; label: string }[] = [
        { value: "password", label: "Password" },
        { value: "pin", label: "PIN" },
      ];
      if (biometricAvailable) {
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
      const pin = await this.showPinKeypad("setup");
      if (pin === false) return;
      await setProtectionPin(pin as string);
      this.setState({ protectionMethod: "pin" });
      toast.success(this.props.t("Change successful"));
    } else if (method === "biometric") {
      if (!this.state.biometricAvailable) {
        toast.error(
          this.props.t(
            "Biometric authentication is not available on this device"
          )
        );
        return;
      }
      const result = await promptBiometricAuth(
        i18n.t("Authenticate to enable biometric protection")
      );
      if (!result.success) {
        toast.error(getBiometricErrorMessage(result.code, this.props.t));
        return;
      }
      await setProtectionBiometric();
      this.setState({ protectionMethod: "biometric" });
      toast.success(this.props.t("Change successful"));
    }
  };

  handleToggleProxy = () => {
    if (this.state.proxyEnabled) {
      this.setState({
        proxyEnabled: false,
        proxyType: "none",
        proxyHost: "",
        proxyPort: "",
        proxyUsername: "",
        proxyPassword: "",
        proxyEditing: false,
      });
      if (window.require) {
        const { ipcRenderer } = window.require("electron");
        ipcRenderer.invoke("set-proxy-config", {
          enabled: false,
          type: "none",
          host: "",
          port: 0,
          username: "",
          password: "",
        });
      }
      toast.success(this.props.t("Change successful"));
      return;
    }
    this.setState({
      proxyEnabled: true,
      proxyType: "http",
      proxyHost: "",
      proxyPort: "",
      proxyUsername: "",
      proxyPassword: "",
      proxyEditing: true,
    });
  };

  handleChangeProxyType = (newType: "http" | "socks5") => {
    if (newType === this.state.proxyType) return;
    this.setState({
      proxyType: newType,
      proxyHost: "",
      proxyPort: "",
      proxyUsername: "",
      proxyPassword: "",
      proxyEditing: true,
    });
  };

  handleTestConnection = async () => {
    const { proxyType, proxyHost, proxyPort, proxyUsername, proxyPassword } =
      this.state;
    if (!proxyHost || !proxyPort) {
      toast.error(this.props.t("Please enter host and port"));
      return;
    }
    const portNum = parseInt(proxyPort);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      toast.error(this.props.t("Please enter host and port"));
      return;
    }
    if (!window.require) return;
    const { ipcRenderer } = window.require("electron");
    this.setState({ isTestingProxy: true });
    toast.loading(this.props.t("Testing connection..."), {
      id: "proxy-test-id",
    });
    try {
      const res = await ipcRenderer.invoke("test-proxy-connection", {
        type: proxyType,
        host: proxyHost,
        port: portNum,
        username: proxyUsername,
        password: proxyPassword,
      });
      if (res && res.ok) {
        toast.success(
          this.props.t("Connection successful") + ` (${res.elapsedMs}ms)`,
          { id: "proxy-test-id" }
        );
      } else {
        toast.error(
          this.props.t("Connection failed") +
            `: ${res?.reason || res?.detail || ""}`,
          { id: "proxy-test-id" }
        );
      }
    } catch (e) {
      toast.error(this.props.t("Connection failed"), { id: "proxy-test-id" });
    } finally {
      this.setState({ isTestingProxy: false });
    }
  };

  handleSaveProxyConfig = async () => {
    const {
      proxyEnabled,
      proxyType,
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword,
    } = this.state;
    if (!proxyHost || !proxyPort) {
      toast.error(this.props.t("Please enter host and port"));
      return;
    }
    const portNum = parseInt(proxyPort);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      toast.error(this.props.t("Please enter host and port"));
      return;
    }
    if (!window.require) return;
    const { ipcRenderer } = window.require("electron");
    try {
      const res = await ipcRenderer.invoke("set-proxy-config", {
        enabled: proxyEnabled,
        type: proxyType,
        host: proxyHost,
        port: portNum,
        username: proxyUsername,
        password: proxyPassword,
      });
      if (res && res.ok) {
        this.setState({ proxyEditing: false });
        toast.success(this.props.t("Save"));
      } else {
        toast.error(this.props.t("Save failed"));
      }
    } catch (e) {
      toast.error(this.props.t("Save failed"));
    }
  };

  renderPinKeypad() {
    const { pinInputMode, pinValue } = this.state;
    if (pinInputMode === "none") return null;

    let title = "";
    if (pinInputMode === "setup-enter") title = i18n.t("Enter new 6-digit PIN");
    else if (pinInputMode === "setup-confirm")
      title = i18n.t("Confirm new 6-digit PIN");
    else if (pinInputMode === "verify")
      title = i18n.t("Enter your current PIN");

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
      <div className="pin-keypad-overlay">
        <div className="pin-keypad-container">
          <div className="pin-keypad-title">{title}</div>
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
          <button className="pin-key-cancel" onClick={this.handlePinCancel}>
            <Trans>Cancel</Trans>
          </button>
        </div>
      </div>
    );
  }

  render() {
    const {
      protectionMethod,
      biometricAvailable,
      proxyEnabled,
      proxyType,
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword,
      isTestingProxy,
      proxyEditing,
    } = this.state;
    const isEnabled = !!protectionMethod;
    const showBiometricOption =
      biometricAvailable || protectionMethod === "biometric";
    const showSocksAuthWarning =
      proxyType === "socks5" && (proxyUsername || proxyPassword);

    return (
      <>
        {this.renderPinKeypad()}
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
                style={{ textAlign: "left" }}
              >
                <option value="password">{this.props.t("Password")}</option>
                <option value="pin">{this.props.t("PIN")}</option>
                {showBiometricOption && (
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
                <Trans>Use Touch ID or Windows Hello to protect the app</Trans>
              )}
            </p>
          </>
        )}
        {isElectron && (
          <>
            <div className="setting-dialog-new-title" key="proxy-toggle">
              <span style={{ width: "calc(100% - 100px)" }}>
                <Trans>Network proxy</Trans>
              </span>
              <span
                className="single-control-switch"
                onClick={this.handleToggleProxy}
                style={proxyEnabled ? {} : { opacity: 0.6 }}
              >
                <span
                  className="single-control-button"
                  style={
                    proxyEnabled
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
              <Trans>Route all network requests through a proxy</Trans>
            </p>
          </>
        )}

        {proxyEnabled && (
          <>
            <div className="setting-dialog-new-title" key="proxy-type">
              <Trans>Proxy type</Trans>
              <select
                className="lang-setting-dropdown"
                value={proxyType}
                onChange={(e) =>
                  this.handleChangeProxyType(
                    e.target.value as "http" | "socks5"
                  )
                }
                style={{ textAlign: "left" }}
              >
                <option value="http">HTTP</option>
                <option value="socks5">SOCKS5</option>
              </select>
            </div>
            {proxyEditing && (
              <div
                style={{
                  marginLeft: "25px",
                  marginRight: "25px",
                }}
              >
                <div key="proxy-host">
                  <input
                    className="token-dialog-username-box"
                    value={proxyHost}
                    onChange={(e) =>
                      this.setState({ proxyHost: e.target.value })
                    }
                    placeholder={this.props.t("Proxy host")}
                  />
                </div>
                <div key="proxy-port">
                  <input
                    className="token-dialog-username-box"
                    type="number"
                    value={proxyPort}
                    onChange={(e) =>
                      this.setState({ proxyPort: e.target.value })
                    }
                    placeholder={this.props.t("Proxy port")}
                  />
                </div>
                <div key="proxy-username">
                  <input
                    className="token-dialog-username-box"
                    value={proxyUsername}
                    onChange={(e) =>
                      this.setState({ proxyUsername: e.target.value })
                    }
                    placeholder={
                      this.props.t("Proxy username") +
                      " (" +
                      this.props.t("Optional") +
                      ")"
                    }
                  />
                </div>
                <div key="proxy-password">
                  <input
                    className="token-dialog-username-box"
                    type="password"
                    value={proxyPassword}
                    onChange={(e) =>
                      this.setState({ proxyPassword: e.target.value })
                    }
                    placeholder={
                      this.props.t("Proxy password") +
                      " (" +
                      this.props.t("Optional") +
                      ")"
                    }
                  />
                </div>
                {showSocksAuthWarning && (
                  <p
                    className="setting-option-subtitle"
                    style={{ color: "#d6732d" }}
                  >
                    <Trans>
                      SOCKS5 authentication is not supported for in-app
                      requests; use HTTP proxy instead
                    </Trans>
                  </p>
                )}
                <div
                  className="setting-dialog-new-title"
                  key="proxy-actions"
                  style={{
                    display: "flex",
                    gap: "8px",
                    margin: "0px",
                    marginTop: "20px",
                    width: "100%",
                  }}
                >
                  <div
                    className="voice-add-confirm"
                    style={{
                      marginRight: "0px",
                    }}
                    onClick={this.handleTestConnection}
                  >
                    {isTestingProxy
                      ? this.props.t("Testing connection...")
                      : this.props.t("Test connection")}
                  </div>
                  <div
                    className="voice-add-confirm"
                    style={{
                      marginRight: "0px",
                    }}
                    onClick={this.handleSaveProxyConfig}
                  >
                    {this.props.t("Save")}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </>
    );
  }
}

export default MoreSetting;
