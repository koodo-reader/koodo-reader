import toast from "react-hot-toast";
import {
  ConfigService,
  SyncUtil,
  ThirdpartyRequest,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import { decryptToken } from "../request/thirdparty";

class SyncService {
  private static syncUtilCache: { [key: string]: SyncUtil } = {};
  static async getSyncUtil() {
    let service = localStorage.getItem("defaultSyncOption");
    if (!service) {
      toast.error("Please select a sync service");
      return new SyncUtil("", {}, new ThirdpartyRequest(TokenService));
    }
    if (!this.syncUtilCache[service]) {
      let config = await decryptToken(service);
      let thirdpartyRequest = new ThirdpartyRequest(TokenService);

      console.log(config, "config", service);
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
