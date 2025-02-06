import toast from "react-hot-toast";
import {
  ConfigService,
  SyncUtil,
  ThirdpartyRequest,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import { decryptToken, getThirdpartyRequest } from "../request/thirdparty";
import i18n from "../../i18n";

class SyncService {
  private static syncUtilCache: { [key: string]: SyncUtil } = {};
  static async getSyncUtil() {
    let service = localStorage.getItem("defaultSyncOption");
    if (!service) {
      toast.error(i18n.t("Please select a sync service"));
      let thirdpartyRequest = await getThirdpartyRequest();
      return new SyncUtil("", {}, thirdpartyRequest);
    }
    if (!this.syncUtilCache[service]) {
      let config = await decryptToken(service);
      let thirdpartyRequest = await getThirdpartyRequest();

      this.syncUtilCache[service] = new SyncUtil(
        service,
        config,
        thirdpartyRequest
      );
    }
    return this.syncUtilCache[service];
  }
}
export default SyncService;
