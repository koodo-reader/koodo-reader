import { isElectron } from "react-device-detect";
import {
  ConfigService,
  KookitConfig,
  TokenService,
  UserRequest,
} from "../../assets/lib/kookit-extra-browser.min";
import packageJson from "../../../package.json";
import toast from "react-hot-toast";
import i18n from "../../i18n";
import { handleExitApp } from "./common";
let userRequest: UserRequest;
export const loginRegister = async (service: string, code: string) => {
  console.log(
    KookitConfig,
    service,
    code,
    KookitConfig.LoginAuthRequest[service]
  );
  let deviceName = detectBrowser();
  let userRequest = await getUserRequest();
  let response = await userRequest.loginRegister({
    code,
    provider: service,
    scope: KookitConfig.LoginAuthRequest[service].extraParams.scope,
    redirect_uri: KookitConfig.ThirdpartyConfig.callbackUrl,
    device_name: deviceName,
    device_type: isElectron ? "Desktop" : "Browser",
    device_os: getOSName(),
    locale: navigator.language,
    os_version: getOsVersionNumber(),
    device_uuid: await TokenService.getFingerprint(),
    app_version: packageJson.version,
  });
  if (response.code === 200) {
    await TokenService.setToken("is_authed", "yes");
    await TokenService.setToken("access_token", response.data.access_token);
    await TokenService.setToken("refresh_token", response.data.refresh_token);
  }
  return response;
};
export const getTempToken = async () => {
  let userRequest = await getUserRequest();
  let response = await userRequest.getTempToken();
  if (response.code === 200) {
    return response;
  } else if (response.code === 401) {
    handleExitApp();
    return response;
  } else {
    toast.error(i18n.t("Fetch failed, error code") + ": " + response.msg);
    return response;
  }
};
export const fetchUserInfo = async () => {
  let userRequest = await getUserRequest();
  let response = await userRequest.getUserInfo();
  if (response.code === 401) {
    handleExitApp();
  }
  return response;
};
export const getUserRequest = async () => {
  if (userRequest) {
    return userRequest;
  }
  userRequest = new UserRequest(TokenService, ConfigService);
  return userRequest;
};
export const getOSName = () => {
  var userAgent = window.navigator.userAgent,
    platform = window.navigator.platform,
    macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"],
    windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"],
    iosPlatforms = ["iPhone", "iPad", "iPod"],
    os = "Unknown OS";

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = "Mac OS";
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = "iOS";
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = "Windows";
  } else if (/Android/.test(userAgent)) {
    os = "Android";
  } else if (!os && /Linux/.test(platform)) {
    os = "Linux";
  }

  return os;
};
export const detectBrowser = () => {
  var userAgent = navigator.userAgent;
  if (userAgent.indexOf("Edg") > -1) {
    return "Microsoft Edge";
  } else if (userAgent.indexOf("Chrome") > -1) {
    return "Chrome";
  } else if (userAgent.indexOf("Firefox") > -1) {
    return "Firefox";
  } else if (userAgent.indexOf("Safari") > -1) {
    return "Safari";
  } else if (userAgent.indexOf("Opera") > -1) {
    return "Opera";
  } else if (
    userAgent.indexOf("Trident") > -1 ||
    userAgent.indexOf("MSIE") > -1
  ) {
    return "Internet Explorer";
  }

  return "Unknown";
};
export const getOsVersionNumber = (): string => {
  const ua = navigator.userAgent;

  // Windows version
  if (ua.includes("Windows")) {
    const version = ua.match(/Windows NT (\d+\.\d+)/)?.[1];
    switch (version) {
      case "10.0":
        return "11"; // Windows 11 reports as 10.0
      case "6.3":
        return "8.1";
      case "6.2":
        return "8";
      case "6.1":
        return "7";
      default:
        return version || "";
    }
  }

  // macOS version
  if (ua.includes("Mac OS X")) {
    return ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace("_", ".") || "";
  }

  // Android version
  if (ua.includes("Android")) {
    return ua.match(/Android (\d+(\.\d+)?)/)?.[1] || "";
  }

  // iOS version
  if (ua.includes("iPhone OS") || ua.includes("iPad")) {
    return ua.match(/OS (\d+_\d+)/)?.[1]?.replace("_", ".") || "";
  }

  return "";
};
