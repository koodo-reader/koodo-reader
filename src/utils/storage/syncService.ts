import toast from "react-hot-toast";
import {
  ConfigService,
  SyncUtil,
} from "../../assets/lib/kookit-extra-browser.min";
import { getThirdpartyRequest } from "../request/thirdparty";
import i18n from "../../i18n";
import { getCloudConfig } from "../file/common";

class SyncService {
  private static syncUtilCache: { [key: string]: SyncUtil } = {};
  private static pickerUtilCache: { [key: string]: SyncUtil } = {};
  static async getSyncUtil() {
    let service = ConfigService.getItem("defaultSyncOption");
    if (!service) {
      let thirdpartyRequest = await getThirdpartyRequest();
      return new SyncUtil("", {}, thirdpartyRequest);
    }
    if (!this.syncUtilCache[service]) {
      let config = await getCloudConfig(service);
      let thirdpartyRequest = await getThirdpartyRequest();

      this.syncUtilCache[service] = new SyncUtil(
        service,
        config,
        thirdpartyRequest
      );
    }
    return this.syncUtilCache[service];
  }
  static removeSyncUtil(service) {
    delete this.syncUtilCache[service];
  }
  static async getPickerUtil(service: string) {
    if (!this.pickerUtilCache[service]) {
      let config = await getCloudConfig(service);
      config.baseFolder = "";
      let thirdpartyRequest = await getThirdpartyRequest();

      this.pickerUtilCache[service] = new SyncUtil(
        service,
        config,
        thirdpartyRequest
      );
    }
    return this.pickerUtilCache[service];
  }
  static async removePickerUtil(service: string) {
    delete this.pickerUtilCache[service];
  }
}
export default SyncService;
