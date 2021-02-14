import axios from "axios";
import { config } from "../../constants/driveList";
import OtherUtil from "../otherUtil";
import BookModel from "../../model/Book";
import localforage from "localforage";

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
export const moveData = (blob, driveIndex, books: BookModel[] = []) => {
  let file = new File([blob], "moveData.zip", {
    lastModified: new Date().getTime(),
    type: blob.type,
  });
  let formData = new FormData();
  formData.append("file", file);
  formData.append(
    "dataPath",
    OtherUtil.getReaderConfig("storageLocation")
      ? OtherUtil.getReaderConfig("storageLocation")
      : window
          .require("electron")
          .ipcRenderer.sendSync("storage-location", "ping")
  );
  axios
    .post(`${config.token_url}/move_data`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      responseType: "blob",
    })
    .then(async (response: any) => {
      if (driveIndex === 4) {
        let deleteBooks = books.map((item) => {
          return localforage.removeItem(item.key);
        });
        await Promise.all(deleteBooks);
      }
    })
    .catch(function (error: any) {
      console.error(error, "移动失败");
    });
};
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
