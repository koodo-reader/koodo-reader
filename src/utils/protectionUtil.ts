import { TokenService } from "../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";

declare var window: any;

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

export async function setProtectionPassword(password: string): Promise<void> {
  const hash = await sha256(password);
  await TokenService.deleteToken("protection_pin");
  await TokenService.deleteToken("protection_biometric_enabled");
  await TokenService.setToken("protection_password", hash);
  await TokenService.setToken("protection_method", "password");
}

export async function setProtectionPin(pin: string): Promise<void> {
  const hash = await sha256(pin);
  await TokenService.deleteToken("protection_password");
  await TokenService.deleteToken("protection_biometric_enabled");
  await TokenService.setToken("protection_pin", hash);
  await TokenService.setToken("protection_method", "pin");
}

export async function setProtectionBiometric(): Promise<boolean> {
  if (!isElectron) return false;
  const { ipcRenderer } = window.require("electron");
  const result = await ipcRenderer.invoke("authenticate-biometric");
  if (result === true) {
    await TokenService.deleteToken("protection_password");
    await TokenService.deleteToken("protection_pin");
    await TokenService.setToken("protection_biometric_enabled", "yes");
    await TokenService.setToken("protection_method", "biometric");
    return true;
  }
  return false;
}

export async function clearProtection(): Promise<void> {
  await TokenService.deleteToken("protection_method");
  await TokenService.deleteToken("protection_password");
  await TokenService.deleteToken("protection_pin");
  await TokenService.deleteToken("protection_biometric_enabled");
}

export async function verifyBiometric(): Promise<boolean> {
  if (!isElectron) return false;
  const { ipcRenderer } = window.require("electron");
  const result = await ipcRenderer.invoke("authenticate-biometric");
  return result === true;
}
