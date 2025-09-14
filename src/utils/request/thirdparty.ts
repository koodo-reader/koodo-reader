import toast from "react-hot-toast";
import {
  ConfigService,
  SyncUtil,
  ThirdpartyRequest,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import i18n from "../../i18n";
import { handleExitApp } from "./common";
let thirdpartyRequest: ThirdpartyRequest | undefined;
export const getThirdpartyRequest = async () => {
  if (thirdpartyRequest) {
    return thirdpartyRequest;
  }
  thirdpartyRequest = new ThirdpartyRequest(TokenService, ConfigService);
  return thirdpartyRequest;
};
export const resetThirdpartyRequest = () => {
  thirdpartyRequest = undefined;
};
export const onSyncCallback = async (service: string, authCode: string) => {
  toast.loading(i18n.t("Adding"), { id: "adding-sync-id" });

  let thirdpartyRequest = await getThirdpartyRequest();

  let syncUtil = new SyncUtil(service, {}, thirdpartyRequest);
  let timer = setTimeout(() => {
    if (
      ConfigService.getItem("serverRegion") !== "china" &&
      navigator.language === "zh-CN"
    ) {
      toast.error(
        i18n.t(
          "Request timed out, You may change the server region to China to solve the connection issue in mainland China. Go to Settings > Account"
        ),
        { id: "adding-sync-error", duration: 6000 }
      );
      return;
    }
  }, 6000);
  let refreshToken = await syncUtil.authToken(authCode);
  clearTimeout(timer);
  if (!refreshToken) {
    toast.error(i18n.t("Authorization failed"), { id: "adding-sync-id" });
    return;
  }
  let region = "0";
  if (service === "pcloud" && authCode.indexOf("$") > -1) {
    // pCloud uses authCode with region info
    let parts = authCode.split("$");
    region = parts[1];
  }
  // FOR PCLOUD, THE REFRESH TOKEN IS THE ACCESS TOKEN, ACCESS TOKEN NEVER EXPIRES
  let res = await encryptToken(service, {
    refresh_token: refreshToken,
    region,
    auth_date: new Date().getTime(),
    service: service,
    version: 1,
  });
  if (res.code === 200) {
    ConfigService.setListConfig(service, "dataSourceList");
    toast.success(i18n.t("Binding successful"), { id: "adding-sync-id" });
  }
  return res;
};
export const encryptToken = async (service: string, config: any) => {
  let syncToken = JSON.stringify(config);
  let isAuthed = await TokenService.getToken("is_authed");
  if (!isAuthed) {
    await TokenService.setToken(service + "_token", syncToken);
    return { code: 200, msg: "success", data: syncToken };
  }
  let thirdpartyRequest = await getThirdpartyRequest();
  let timer = setTimeout(() => {
    if (
      ConfigService.getItem("serverRegion") !== "china" &&
      navigator.language === "zh-CN"
    ) {
      toast.error(
        i18n.t(
          "Request timed out, You may change the server region to China to solve the connection issue in mainland China. Go to Settings > Account"
        ),
        { id: "adding-sync-error", duration: 6000 }
      );
      return;
    }
  }, 6000);
  let response = await thirdpartyRequest.encryptToken({
    token: syncToken,
  });
  clearTimeout(timer);
  if (response.code === 200) {
    await TokenService.setToken(
      service + "_token",
      response.data.encrypted_token
    );
    return response;
  } else if (response.code === 401) {
    handleExitApp();
    return response;
  } else {
    toast.error(i18n.t("Encryption failed, error code") + ": " + response.msg);
    if (response.code === 20004) {
      toast(
        i18n.t("Please login again to update your membership on this device")
      );
    }
    return response;
  }
};
export const decryptToken = async (service: string) => {
  let isAuthed = await TokenService.getToken("is_authed");
  if (!isAuthed) {
    let syncToken = (await TokenService.getToken(service + "_token")) || "{}";
    return {
      code: 200,
      msg: "success",
      data: { token: syncToken },
    };
  }
  let thirdpartyRequest = await getThirdpartyRequest();
  let timer = setTimeout(() => {
    if (
      ConfigService.getItem("serverRegion") !== "china" &&
      navigator.language === "zh-CN"
    ) {
      toast.error(
        i18n.t(
          "Request timed out, You may change the server region to China to solve the connection issue in mainland China. Go to Settings > Account"
        ),
        { id: "adding-sync-error", duration: 6000 }
      );
      return;
    }
  }, 6000);
  let encryptedToken = await TokenService.getToken(service + "_token");
  clearTimeout(timer);
  if (!encryptedToken || encryptedToken === "{}") {
    return {};
  }
  let response = await thirdpartyRequest.decryptToken({
    encrypted_token: encryptedToken,
  });
  if (response.code === 200) {
    return response;
  } else if (response.code === 401) {
    handleExitApp();
    return response;
  } else {
    toast.error(i18n.t("Decryption failed, error code") + ": " + response.msg);
    if (response.code === 20004) {
      toast(
        i18n.t("Please login again to update your membership on this device")
      );
    }
    return response;
  }
};
