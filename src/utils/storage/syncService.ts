import { SyncUtil } from "../../assets/lib/kookit-extra-browser.min";
import { decryptToken, getThirdpartyRequest } from "../request/thirdparty";
import ConfigService from "./configService";

class SyncService {
  private static syncUtilCache: { [key: string]: SyncUtil } = {};
  static async getSyncUtil() {
    let service = ConfigService.getReaderConfig("defaultSyncOption");
    if (!this.syncUtilCache[service]) {
      let config = await decryptToken(service);
      let thirdpartyRequest = await getThirdpartyRequest();

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
