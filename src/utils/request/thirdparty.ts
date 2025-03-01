import toast from "react-hot-toast";
import {
  ConfigService,
  SyncUtil,
  ThirdpartyRequest,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import i18n from "../../i18n";
import { handleExitApp } from "./common";

export const getThirdpartyRequest = async () => {
  let thirdpartyRequest = new ThirdpartyRequest(TokenService, ConfigService);
  return thirdpartyRequest;
};
export const onSyncCallback = async (service: string, authCode: string) => {
  toast.loading(i18n.t("Adding"), { id: "adding-sync-id" });
  let thirdpartyRequest = await getThirdpartyRequest();

  let syncUtil = new SyncUtil(service, {}, thirdpartyRequest);
  let refreshToken = await syncUtil.authToken(authCode);
  if (!refreshToken) {
    toast.error(i18n.t("Authorization failed"), { id: "adding-sync-id" });
    return;
  }
  // FOR PCLOUD, THE REFRESH TOKEN IS THE ACCESS TOKEN, ACCESS TOKEN NEVER EXPIRES
  let res = await encryptToken(service, {
    refresh_token: refreshToken,
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
    return 200;
  }
  let thirdpartyRequest = await getThirdpartyRequest();

  let response = await thirdpartyRequest.encryptToken({
    token: syncToken,
  });
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
    return response;
  }
};
export const decryptToken = async (service: string) => {
  let isAuthed = await TokenService.getToken("is_authed");
  if (!isAuthed) {
    let syncToken = (await TokenService.getToken(service + "_token")) || "{}";
    return JSON.parse(syncToken);
  }
  let thirdpartyRequest = await getThirdpartyRequest();
  let encryptedToken = await TokenService.getToken(service + "_token");
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
    return response;
  }
};
