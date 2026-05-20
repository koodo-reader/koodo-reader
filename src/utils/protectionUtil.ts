import { isElectron } from "react-device-detect";
import { TokenService } from "../assets/lib/kookit-extra-browser.min";

declare var window: any;

export interface BiometricCapability {
  available: boolean;
  provider: string;
  platform: string;
  status?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  code: string;
  provider?: string;
}

export async function getProtectionMethod(): Promise<string> {
  return (await TokenService.getToken("protection_method")) || "";
}

export async function verifyPassword(input: string): Promise<boolean> {
  const stored = await TokenService.getToken("protection_password");
  if (!stored) return false;
  return input === stored;
}

export async function verifyPin(input: string): Promise<boolean> {
  const stored = await TokenService.getToken("protection_pin");
  if (!stored) return false;
  return input === stored;
}

export async function getBiometricCapability(): Promise<BiometricCapability> {
  if (!isElectron) {
    return {
      available: false,
      provider: "Biometric",
      platform: "web",
      status: "Unsupported",
    };
  }

  return await window
    .require("electron")
    .ipcRenderer.invoke("get-biometric-capability");
}

export async function promptBiometricAuth(
  message: string
): Promise<BiometricAuthResult> {
  if (!isElectron) {
    return {
      success: false,
      code: "Unsupported",
      provider: "Biometric",
    };
  }

  return await window
    .require("electron")
    .ipcRenderer.invoke("prompt-biometric-auth", {
      message,
    });
}

export function getBiometricErrorMessage(
  code: string,
  t: (title: string) => string
): string {
  if (code === "Canceled" || code === "Cancelled") {
    return t("Authentication required to access the app");
  }

  if (
    [
      "Unavailable",
      "Unsupported",
      "DeviceNotPresent",
      "NotConfiguredForUser",
      "DisabledByPolicy",
    ].includes(code)
  ) {
    return t("Biometric authentication is not available on this device");
  }

  return t("Biometric authentication failed, please try again");
}

export async function setProtectionPassword(password: string): Promise<void> {
  await TokenService.deleteToken("protection_pin");
  await TokenService.setToken("protection_password", password);
  await TokenService.setToken("protection_method", "password");
}

export async function setProtectionPin(pin: string): Promise<void> {
  await TokenService.deleteToken("protection_password");
  await TokenService.setToken("protection_pin", pin);
  await TokenService.setToken("protection_method", "pin");
}

export async function setProtectionBiometric(): Promise<void> {
  await TokenService.deleteToken("protection_password");
  await TokenService.deleteToken("protection_pin");
  await TokenService.setToken("protection_method", "biometric");
}

export async function clearProtection(): Promise<void> {
  await TokenService.deleteToken("protection_method");
  await TokenService.deleteToken("protection_password");
  await TokenService.deleteToken("protection_pin");
}
