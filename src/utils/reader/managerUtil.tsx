import { isElectron } from "react-device-detect";

class ManagerUtil {
  static reloadManager = () => {
    if (isElectron) {
      window.require("electron").ipcRenderer.invoke("reload-main", "ping");
    } else {
      window.location.reload();
    }
  };
}
export default ManagerUtil;
