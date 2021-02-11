import axios from "axios";
import { config } from "../../constants/driveList";

export function getParamsFromUrl() {
  var hashParams: any = {};
  var e,
    r = /([^&;=]+)=?([^&;]*)/g,
    q =
      window.location.hash.substring(2) ||
      window.location.search.substring(1).split("#")[0];

  while ((e = r.exec(q))) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

class SyncUtil {
  static changeLocation(
    oldPath: string,
    newPath: string,
    handleMessage: (message: string) => void,
    handleMessageBox: (isShow: boolean) => void
  ) {
    axios
      .post(`${config.token_url}/change_location`, {
        oldPath,
        newPath,
      })
      .then(function (response: any) {
        console.log(response, "修改成功");
        handleMessage("Change Successfully");
        handleMessageBox(true);
      })
      .catch(function (error: any) {
        console.log(error, "修改失败");
        handleMessage("Change Failed");
        handleMessageBox(true);
      });
  }
  static syncData() {}
}

export default SyncUtil;
