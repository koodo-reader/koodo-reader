import axios from "axios";
import toast from "react-hot-toast";
import i18n from "../../i18n";
import {
  ConfigService,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import { reloadManager } from "../common";
const PUBLIC_URL = "https://api.960960.xyz";
const CN_PUBLIC_URL = "https://api.koodoreader.cn";
export const getPublicUrl = () => {
  let isUseCN = false;
  if (ConfigService.getItem("serverRegion")) {
    isUseCN = ConfigService.getItem("serverRegion") === "china";
  } else {
    if (navigator.language && navigator.language === "zh-CN") {
      isUseCN = true;
    }
  }
  return isUseCN ? CN_PUBLIC_URL : PUBLIC_URL;
};
export const checkDeveloperUpdate = async () => {
  let res = await axios.get(
    getPublicUrl() + `/api/update_dev?name=${navigator.language}`
  );
  return res.data.log;
};
export const uploadFile = async (url: string, file: any) => {
  return new Promise<boolean>((resolve) => {
    axios
      .put(url, file, {})
      .then(() => {
        resolve(true);
      })
      .catch((err) => {
        console.error(err);
        resolve(false);
      });
  });
};
export const checkStableUpdate = async () => {
  let res = await axios.get(
    getPublicUrl() + `/api/update?name=${navigator.language}`
  );
  return res.data.log;
};
export const handleExitApp = async () => {
  toast.error(i18n.t("Authorization failed, please login again"));
  await TokenService.deleteToken("is_authed");
  await TokenService.deleteToken("access_token");
  await TokenService.deleteToken("refresh_token");
  //路由到login页面
  reloadManager();
};
