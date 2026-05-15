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

const isElectronRenderer = () => {
  return (
    typeof window !== "undefined" &&
    typeof window.require === "function" &&
    !!window.require("electron")?.ipcRenderer
  );
};

export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getProtectionMethod(): Promise<string> {
  return (await TokenService.getToken("protection_method")) || "";
}

export async function verifyPassword(input: string): Promise<boolean> {
  const stored = await TokenService.getToken("protection_password");
  if (!stored) return false;
  const hash = await sha256(input);
  return hash === stored;
}

export async function verifyPin(input: string): Promise<boolean> {
  const stored = await TokenService.getToken("protection_pin");
  if (!stored) return false;
  const hash = await sha256(input);
  return hash === stored;
}

export async function getBiometricCapability(): Promise<BiometricCapability> {
  if (!isElectronRenderer()) {
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
  if (!isElectronRenderer()) {
    return {
      success: false,
      code: "Unsupported",
      provider: "Biometric",
    };
  }

  return await window.require("electron").ipcRenderer.invoke(
    "prompt-biometric-auth",
    {
      message,
    }
  );
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
  const hash = await sha256(password);
  await TokenService.deleteToken("protection_pin");
  await TokenService.setToken("protection_password", hash);
  await TokenService.setToken("protection_method", "password");
}

export async function setProtectionPin(pin: string): Promise<void> {
  const hash = await sha256(pin);
  await TokenService.deleteToken("protection_password");
  await TokenService.setToken("protection_pin", hash);
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
