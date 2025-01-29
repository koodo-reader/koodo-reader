import toast from "react-hot-toast";
import {
  SyncUtil,
  ThirdpartyRequest,
} from "../../assets/lib/kookit-extra-browser.min";
import ConfigService from "../storage/configService";
import TokenService from "../storage/tokenService";
import i18n from "../../i18n";
import { handleExitApp } from "./common";

export const getThirdpartyRequest = async () => {
  let thirdpartyRequest = new ThirdpartyRequest(TokenService);
  return thirdpartyRequest;
};
export const onSyncCallback = async (service: string, authCode: string) => {
  toast.loading(i18n.t("Adding..."));
  console.log(service, authCode);
  let thirdpartyRequest = await getThirdpartyRequest();
  console.log(thirdpartyRequest, "thirdpartyRequest");

  let syncUtil = new SyncUtil(service, {}, thirdpartyRequest);
  let refreshToken = await syncUtil.authToken(authCode);
  console.log(refreshToken, "refreshToken");
  if (!refreshToken) {
    toast.error(i18n.t("Authorization failed"));
    return;
  }
  let code = await encryptToken(service, {
    refresh_token: refreshToken,
  });
  console.log(code, "code43665");
  if (code === 200) {
    ConfigService.setListConfig(service, "syncOptionList");

    toast.success(i18n.t("Binding successful"));
  }
  return code;
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
  console.log(response, "response");
  if (response.code === 200) {
    console.log(67756765, service);
    TokenService.setToken(service + "_token", response.data.encrypted_token);
    console.log(response.data.encrypted_token, "response.data.encrypted_token");
  } else if (response.code === 401) {
    handleExitApp();
    return;
  } else {
    toast.error(i18n.t("Encryption failed, error code: ") + response.code);
  }
  console.log(response.code, "response.code");
  return response.code;
};
export const decryptToken = async (service: string) => {
  let isAuthed = await TokenService.getToken("is_authed");
  if (!isAuthed) {
    let syncToken = (await TokenService.getToken(service + "_token")) || "{}";
    return JSON.parse(syncToken);
  }
  let thirdpartyRequest = await getThirdpartyRequest();
  let encryptedToken = TokenService.getToken(service + "_token");
  if (!encryptedToken) {
    return {};
  }
  let response = await thirdpartyRequest.decryptToken({
    encrypted_token: encryptedToken,
  });
  console.log(response.code);
  if (response.code === 200) {
    console.log(response.data.token, "token");
    return JSON.parse(response.data.token);
  } else if (response.code === 401) {
    handleExitApp();
  }
  return {};
};
