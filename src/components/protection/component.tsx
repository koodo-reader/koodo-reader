import { useEffect, useState } from "react";
import "./protection.css";
import {
  getBiometricErrorMessage,
  promptBiometricAuth,
  verifyPassword,
  verifyPin,
} from "../../utils/reader/protectionUtil";
import { vexPasswordInputAsync } from "../../utils/common";
import toast from "react-hot-toast";
import i18n from "../../i18n";
import { Trans } from "react-i18next";
import TokenService from "../../utils/storage/tokenService";

// Track whether the startup auth check has already been performed in this session
let _hasCheckedOnStartup = false;

const ProtectionOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [method, setMethod] = useState("");
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);
  const [biometricError, setBiometricError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const startPasswordAuth = async (authMethod: string) => {
    let success = false;
    while (!success) {
      if (authMethod === "password") {
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
    setIsVisible(false);
  };

  const startBiometricAuth = async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    setBiometricError("");
    const result = await promptBiometricAuth(
      i18n.t("Authenticate to unlock the app")
    );
    if (result.success) {
      setIsVisible(false);
      setIsAuthenticating(false);
      return;
    }

    setIsAuthenticating(false);
    setBiometricError(
      getBiometricErrorMessage(result.code, i18n.t.bind(i18n))
    );
  };

  useEffect(() => {
    if (_hasCheckedOnStartup) return;
    _hasCheckedOnStartup = true;
    (async () => {
      const authMethod =
        (await TokenService.getToken("protection_method")) || "";
      if (authMethod) {
        setIsVisible(true);
        setMethod(authMethod);
        if (authMethod === "password") {
          startPasswordAuth(authMethod);
        } else if (authMethod === "biometric") {
          startBiometricAuth();
        }
      }
    })();
  }, []);

  const handlePinDigit = (digit: string) => {
    if (pinValue.length >= 6) return;
    const next = pinValue + digit;
    setPinValue(next);
    setPinError(false);
    if (next.length === 6) {
      verifyPin(next).then((ok) => {
        if (ok) {
          setIsVisible(false);
        } else {
          setPinValue("");
          setPinError(true);
        }
      });
    }
  };

  const handlePinDelete = () => {
    setPinValue((prev) => prev.slice(0, -1));
    setPinError(false);
  };

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
              onClick={startBiometricAuth}
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
};

export default ProtectionOverlay;
