import React, { useEffect, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { MoreSettingProps, MoreSettingState } from "./interface";
import toast from "react-hot-toast";
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
import TokenService from "../../../utils/storage/tokenService";
import SwitchRow from "../../../components/readerSettings/switchRow";

const MoreSetting = (props: MoreSettingProps) => {
  const [state, setState] = useState<MoreSettingState>({
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
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  const updateState = (patch: Partial<MoreSettingState>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setState((prev) => ({ ...prev, ...patch }));
  };

  useEffect(() => {
    Promise.all([
      TokenService.getToken("protection_method"),
      getBiometricCapability(),
    ]).then(([method, biometricCapability]) => {
      updateState({
        protectionMethod: method || "",
        biometricAvailable: biometricCapability.available,
      });
    });
    if (window.electronAPI) {
      const ipcRenderer = window.electronAPI;
      ipcRenderer.invoke("get-proxy-config").then((cfg: any) => {
        if (!cfg) return;
        updateState({
          proxyEnabled: cfg.enabled && cfg.type !== "none",
          proxyType: cfg.type || "none",
          proxyHost: cfg.host || "",
          proxyPort: cfg.port ? String(cfg.port) : "",
          proxyUsername: cfg.username || "",
          proxyPassword: cfg.password || "",
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showPinKeypad = (mode: "setup" | "verify"): Promise<string | false> => {
    return new Promise((resolve) => {
      updateState({
        pinInputMode: mode === "setup" ? "setup-enter" : "verify",
        pinValue: "",
        pinFirstValue: "",
        pinCallback: resolve,
      });
    });
  };

  const handlePinDigit = (digit: string) => {
    const { pinValue, pinInputMode, pinFirstValue, pinCallback } =
      stateRef.current;
    if (pinValue.length >= 6) return;
    const next = pinValue + digit;
    if (next.length === 6) {
      if (pinInputMode === "setup-enter") {
        updateState({
          pinInputMode: "setup-confirm",
          pinFirstValue: next,
          pinValue: "",
        });
      } else if (pinInputMode === "setup-confirm") {
        if (next === pinFirstValue) {
          updateState({
            pinInputMode: "none",
            pinValue: "",
            pinFirstValue: "",
          });
          pinCallback && pinCallback(next);
        } else {
          toast.error(props.t("PINs do not match, please try again"));
          updateState({
            pinValue: "",
            pinFirstValue: "",
            pinInputMode: "setup-enter",
          });
        }
      } else if (pinInputMode === "verify") {
        updateState({ pinInputMode: "none", pinValue: "" });
        pinCallback && pinCallback(next);
      }
      return;
    }
    updateState({ pinValue: next });
  };

  const handlePinDelete = () => {
    updateState({ pinValue: stateRef.current.pinValue.slice(0, -1) });
  };

  const handlePinCancel = () => {
    const { pinCallback } = stateRef.current;
    updateState({
      pinInputMode: "none",
      pinValue: "",
      pinFirstValue: "",
      pinCallback: null,
    });
    pinCallback && pinCallback(false);
  };

  const verifyCurrentMethod = async (): Promise<boolean> => {
    const { protectionMethod } = stateRef.current;
    if (protectionMethod === "password") {
      const input = await vexPasswordInputAsync(
        i18n.t("Enter your current password")
      );
      if (!input) return false;
      const ok = await verifyPassword(input as string);
      if (!ok) toast.error(props.t("Incorrect password"));
      return ok;
    } else if (protectionMethod === "pin") {
      const pin = await showPinKeypad("verify");
      if (pin === false) return false;
      const ok = await verifyPin(pin as string);
      if (!ok) toast.error(props.t("Incorrect PIN"));
      return ok;
    } else if (protectionMethod === "biometric") {
      const result = await promptBiometricAuth(
        i18n.t("Authenticate to change protection settings")
      );
      if (!result.success) {
        toast.error(getBiometricErrorMessage(result.code, props.t));
      }
      return result.success;
    }
    return true;
  };

  const handleToggleProtection = async () => {
    const { protectionMethod, biometricAvailable } = stateRef.current;
    if (protectionMethod) {
      const verified = await verifyCurrentMethod();
      if (!verified) return;
      await clearProtection();
      updateState({ protectionMethod: "" });
      toast.success(props.t("Change successful"));
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
      await setupMethod(method as string);
    }
  };

  const handleChangeMethod = async (newMethod: string) => {
    const { protectionMethod } = stateRef.current;
    if (newMethod === protectionMethod) return;
    const verified = await verifyCurrentMethod();
    if (!verified) return;
    await setupMethod(newMethod);
  };

  const setupMethod = async (method: string) => {
    if (method === "password") {
      const input = await vexPasswordInputAsync(
        i18n.t("Enter new password"),
        i18n.t("Confirm new password")
      );
      if (input === false) {
        toast.error(props.t("Passwords do not match or input is empty"));
        return;
      }
      await setProtectionPassword(input as string);
      updateState({ protectionMethod: "password" });
      toast.success(props.t("Change successful"));
    } else if (method === "pin") {
      const pin = await showPinKeypad("setup");
      if (pin === false) return;
      await setProtectionPin(pin as string);
      updateState({ protectionMethod: "pin" });
      toast.success(props.t("Change successful"));
    } else if (method === "biometric") {
      if (!stateRef.current.biometricAvailable) {
        toast.error(
          props.t("Biometric authentication is not available on this device")
        );
        return;
      }
      const result = await promptBiometricAuth(
        i18n.t("Authenticate to enable biometric protection")
      );
      if (!result.success) {
        toast.error(getBiometricErrorMessage(result.code, props.t));
        return;
      }
      await setProtectionBiometric();
      updateState({ protectionMethod: "biometric" });
      toast.success(props.t("Change successful"));
    }
  };

  const handleToggleProxy = () => {
    if (stateRef.current.proxyEnabled) {
      updateState({
        proxyEnabled: false,
        proxyType: "none",
        proxyHost: "",
        proxyPort: "",
        proxyUsername: "",
        proxyPassword: "",
        proxyEditing: false,
      });
      if (window.electronAPI) {
        const ipcRenderer = window.electronAPI;
        ipcRenderer.invoke("set-proxy-config", {
          enabled: false,
          type: "none",
          host: "",
          port: 0,
          username: "",
          password: "",
        });
      }
      toast.success(props.t("Change successful"));
      return;
    }
    updateState({
      proxyEnabled: true,
      proxyType: "http",
      proxyHost: "",
      proxyPort: "",
      proxyUsername: "",
      proxyPassword: "",
      proxyEditing: true,
    });
  };

  const handleChangeProxyType = (newType: "http" | "socks5") => {
    if (newType === stateRef.current.proxyType) return;
    updateState({
      proxyType: newType,
      proxyHost: "",
      proxyPort: "",
      proxyUsername: "",
      proxyPassword: "",
      proxyEditing: true,
    });
  };

  const handleTestConnection = async () => {
    const { proxyType, proxyHost, proxyPort, proxyUsername, proxyPassword } =
      stateRef.current;
    if (!proxyHost || !proxyPort) {
      toast.error(props.t("Please enter host and port"));
      return;
    }
    const portNum = parseInt(proxyPort);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      toast.error(props.t("Please enter host and port"));
      return;
    }
    if (!window.electronAPI) return;
    const ipcRenderer = window.electronAPI;
    updateState({ isTestingProxy: true });
    toast.loading(props.t("Testing connection..."), {
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
          props.t("Connection successful") + ` (${res.elapsedMs}ms)`,
          { id: "proxy-test-id" }
        );
      } else {
        toast.error(
          props.t("Connection failed") + `: ${res?.reason || res?.detail || ""}`,
          { id: "proxy-test-id" }
        );
      }
    } catch (e) {
      toast.error(props.t("Connection failed"), { id: "proxy-test-id" });
    } finally {
      updateState({ isTestingProxy: false });
    }
  };

  const handleSaveProxyConfig = async () => {
    const {
      proxyEnabled,
      proxyType,
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword,
    } = stateRef.current;
    if (!proxyHost || !proxyPort) {
      toast.error(props.t("Please enter host and port"));
      return;
    }
    const portNum = parseInt(proxyPort);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      toast.error(props.t("Please enter host and port"));
      return;
    }
    if (!window.electronAPI) return;
    const ipcRenderer = window.electronAPI;
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
        updateState({ proxyEditing: false });
        toast.success(props.t("Added successfully"));
      } else {
        toast.error(props.t("Save failed"));
      }
    } catch (e) {
      toast.error(props.t("Save failed"));
    }
  };

  const renderPinKeypad = () => {
    const { pinInputMode, pinValue } = state;
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
                    onClick={handlePinDelete}
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
                  onClick={() => handlePinDigit(String(d))}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <button className="pin-key-cancel" onClick={handlePinCancel}>
            <Trans>Cancel</Trans>
          </button>
        </div>
      </div>
    );
  };

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
  } = state;
  const isEnabled = !!protectionMethod;
  const showBiometricOption =
    biometricAvailable || protectionMethod === "biometric";
  const showSocksAuthWarning =
    proxyType === "socks5" && (proxyUsername || proxyPassword);

  return (
    <>
      {renderPinKeypad()}
      <SwitchRow
        variant="setting"
        title={<Trans>Enable software protection</Trans>}
        isEnabled={isEnabled}
        onClick={handleToggleProtection}
      />
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
              onChange={(e) => handleChangeMethod(e.target.value)}
              style={{ textAlign: "left" }}
            >
              <option value="password">{props.t("Password")}</option>
              <option value="pin">{props.t("PIN")}</option>
              {showBiometricOption && (
                <option value="biometric">{props.t("Biometric")}</option>
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
          <SwitchRow
            variant="setting"
            title={<Trans>Network proxy</Trans>}
            isEnabled={proxyEnabled}
            onClick={handleToggleProxy}
          />
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
                handleChangeProxyType(e.target.value as "http" | "socks5")
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
                  onChange={(e) => updateState({ proxyHost: e.target.value })}
                  placeholder={props.t("Proxy host")}
                />
              </div>
              <div
                style={{
                  marginTop: "5px",
                  marginBottom: "2px",
                  marginLeft: "2px",
                  fontSize: "12px",
                  opacity: 0.8,
                }}
              >
                {props.t("Example")}: {"127.0.0.1"}
              </div>
              <div key="proxy-port">
                <input
                  className="token-dialog-username-box"
                  type="number"
                  value={proxyPort}
                  onChange={(e) => updateState({ proxyPort: e.target.value })}
                  placeholder={props.t("Proxy port")}
                />
              </div>
              <div
                style={{
                  marginTop: "5px",
                  marginBottom: "2px",
                  marginLeft: "2px",
                  fontSize: "12px",
                  opacity: 0.8,
                }}
              >
                {props.t("Example")}: {"1080"}
              </div>
              <div key="proxy-username">
                <input
                  className="token-dialog-username-box"
                  value={proxyUsername}
                  onChange={(e) =>
                    updateState({ proxyUsername: e.target.value })
                  }
                  placeholder={
                    props.t("Proxy username") +
                    " (" +
                    props.t("Optional") +
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
                    updateState({ proxyPassword: e.target.value })
                  }
                  placeholder={
                    props.t("Proxy password") +
                    " (" +
                    props.t("Optional") +
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
                    SOCKS5 authentication is not supported for in-app requests;
                    use HTTP proxy instead
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
                  onClick={handleTestConnection}
                >
                  {isTestingProxy
                    ? props.t("Testing connection...")
                    : props.t("Test connection")}
                </div>
                <div
                  className="voice-add-confirm"
                  style={{
                    marginRight: "0px",
                  }}
                  onClick={handleSaveProxyConfig}
                >
                  {props.t("Save")}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default MoreSetting;
