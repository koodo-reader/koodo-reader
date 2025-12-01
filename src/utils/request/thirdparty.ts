import toast from "react-hot-toast";
import {
  ConfigService,
  SyncUtil,
  ThirdpartyRequest,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import i18n from "../../i18n";
import { handleExitApp } from "./common";
import { getServerRegion } from "../common";
let thirdpartyRequest: ThirdpartyRequest | undefined;
export const getThirdpartyRequest = async () => {
  if (thirdpartyRequest) {
    return thirdpartyRequest;
  }
  thirdpartyRequest = new ThirdpartyRequest(
    TokenService,
    ConfigService,
    getServerRegion()
  );
  return thirdpartyRequest;
};
export const resetThirdpartyRequest = () => {
  thirdpartyRequest = undefined;
};
export const onSyncCallback = async (service: string, authCode: string) => {
  toast.loading(i18n.t("Adding"), { id: "adding-sync-id" });

  let thirdpartyRequest = await getThirdpartyRequest();

  let syncUtil = new SyncUtil(service, {}, thirdpartyRequest);
  let result = await syncUtil.authToken(authCode);
  if (!result.refresh_token) {
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
  let res = await encryptToken(
    service,
    service === "yiyiwu" || service === "dubox"
      ? {
          refresh_token: result.refresh_token,
          access_token: result.access_token || "",
          expires_at:
            new Date().getTime() +
            (service === "yiyiwu" ? 30 * 60 * 1000 : 2592000 * 1000),
          region,
          auth_date: new Date().getTime(),
          service: service,
          version: 1,
        }
      : {
          refresh_token: result.refresh_token,
          region,
          auth_date: new Date().getTime(),
          service: service,
          version: 1,
        }
  );
  if (res.code === 200) {
    ConfigService.setListConfig(service, "dataSourceList");
    toast.success(i18n.t("Binding successful"), { id: "adding-sync-id" });
  }
  if (service === "yiyiwu") {
    toast(
      i18n.t(
        "The 115 cloud is only recommended for VIP users, as it is nearly unusable for free users. Additionally, due to API issues with 115 cloud, synchronization can be very slow. If you insist on using 115 cloud storage for syncing, it is recommended to enable Koodo Sync simultaneously, which will significantly improve the synchronization speed."
      ),
      { duration: 8000 }
    );
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
    if (response.code === 20004) {
      toast(
        i18n.t("Please login again to update your membership on this device")
      );
    }
    return response;
  }
};
