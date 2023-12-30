import { restore } from "./restoreUtil";
import StorageUtil from "../serviceUtils/storageUtil";
import { driveConfig } from "../../constants/driveList";
import axios from "axios";

class OneDriveUtil {
  static UploadFile(blob: any) {
    return new Promise<boolean>(async (resolve, reject) => {
      var refresh_token = StorageUtil.getReaderConfig("onedrive_token") || "";
      let res = await axios.post(driveConfig.onedriveRefreshUrl, {
        refresh_token,
        redirect_uri: driveConfig.callbackUrl,
      });
      const fs = window.require("fs");
      const path = window.require("path");
      const { ipcRenderer } = window.require("electron");

      const dirPath = ipcRenderer.sendSync("user-data", "ping");
      const arrayBuffer = await blob.arrayBuffer();
      const filename = "data.zip";

      fs.writeFileSync(path.join(dirPath, filename), Buffer.from(arrayBuffer));

      let result = await ipcRenderer.invoke("onedrive-upload", {
        accessToken: res.data.access_token,
        filename,
      });
      if (!result) resolve(false);
      try {
        const fs_extra = window.require("fs-extra");
        fs_extra.remove(path.join(dirPath, `data.zip`), (error: any) => {
          if (error) resolve(false);
          resolve(true);
        });
      } catch (e) {
        console.log("error removing ", path.join(dirPath, `data.zip`));
        resolve(false);
      }
    });
  }
  static DownloadFile() {
    return new Promise<boolean>(async (resolve, reject) => {
      var refresh_token = StorageUtil.getReaderConfig("onedrive_token") || "";
      let res = await axios.post(driveConfig.onedriveRefreshUrl, {
        refresh_token,
        redirect_uri: driveConfig.callbackUrl,
      });
      const filename = "data.zip";
      const fs = window.require("fs");
      const path = window.require("path");
      const { ipcRenderer } = window.require("electron");

      const dirPath = ipcRenderer.sendSync("user-data", "ping");

      let result = await ipcRenderer.invoke("onedrive-download", {
        accessToken: res.data.access_token,
        filename,
      });
      if (result) {
        var data = fs.readFileSync(path.join(dirPath, `data.zip`));
        let blobTemp: any = new Blob([data], { type: "application/zip" });
        let fileTemp = new File([blobTemp], "data.zip", {
          lastModified: new Date().getTime(),
          type: blobTemp.type,
        });
        let result = await restore(fileTemp);
        if (!result) resolve(false);
      }
      resolve(true);
      try {
        const fs_extra = window.require("fs-extra");
        fs_extra.remove(path.join(dirPath, `data.zip`), (error: any) => {
          if (error) resolve(false);
          resolve(true);
        });
      } catch (e) {
        console.log("error removing ", path.join(dirPath, `data.zip`));
        resolve(false);
      }
    });
  }
}

export default OneDriveUtil;
