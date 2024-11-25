import { restore } from "./restore";
import StorageUtil from "../service/configService";
import { driveConfig } from "../../constants/driveList";
import axios from "axios";

class DropboxUtil {
  static UploadFile(blob: any) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const fileName = "data.zip";
        var refresh_token = StorageUtil.getReaderConfig("dropbox_token") || "";
        let res = await axios.post(driveConfig.dropboxRefreshUrl, {
          refresh_token,
        });
        let file = new File([blob], fileName, {
          lastModified: new Date().getTime(),
          type: blob.type,
        });
        const accessToken = res.data.access_token;
        const response = await axios.post(
          "https://content.dropboxapi.com/2/files/upload",
          file,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/octet-stream",
              "Dropbox-API-Arg": JSON.stringify({
                path: "/" + fileName,
                mode: "overwrite",
                autorename: true,
                mute: false,
              }),
            },
          }
        );

        if (response.status === 200) {
          resolve(true);
        } else {
          reject(new Error("File upload failed"));
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  static DownloadFile() {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const fileName = "data.zip";
        var refresh_token = StorageUtil.getReaderConfig("dropbox_token") || "";
        let res = await axios.post(driveConfig.dropboxRefreshUrl, {
          refresh_token,
        });
        const accessToken = res.data.access_token;
        const response = await axios({
          url: "https://content.dropboxapi.com/2/files/download",
          method: "post",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Dropbox-API-Arg": JSON.stringify({
              path: "/" + fileName,
            }),
          },
          responseType: "blob", // This is important for downloading files
        });
        let file = response.data;
        file.lastModifiedDate = new Date();
        file.name = fileName;
        let result = await restore(file);
        if (result) {
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        console.error("Error downloading file from Dropbox:", error);
      }
    });
  }
}

export default DropboxUtil;
