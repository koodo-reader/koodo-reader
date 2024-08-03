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
      let file = new File([blob], "data.zip", {
        lastModified: new Date().getTime(),
        type: blob.type,
      });
      const accessToken = res.data.access_token;
      const uploadSessionUrl =
        "https://graph.microsoft.com/v1.0/me/drive/special/approot:/" +
        file.name +
        ":/createUploadSession";

      try {
        const sessionResponse = await axios.post(uploadSessionUrl, null, {
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json",
          },
        });

        const uploadUrl = sessionResponse.data.uploadUrl;

        const response = await axios.put(uploadUrl, file, {
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": file.type,
          },
        });

        console.log("File uploaded successfully:", response);
      } catch (error) {
        console.error("Error occurred during file upload:", error);
        resolve(false);
      }
      resolve(true);
    });
  }
  static DownloadFile() {
    return new Promise<boolean>(async (resolve, reject) => {
      const fileName = "data.zip";
      var refresh_token = StorageUtil.getReaderConfig("onedrive_token") || "";
      let res = await axios.post(driveConfig.onedriveRefreshUrl, {
        refresh_token,
        redirect_uri: driveConfig.callbackUrl,
      });
      const accessToken = res.data.access_token;
      const downloadUrl = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${fileName}:/content`;
      try {
        const response = await axios.get(downloadUrl, {
          responseType: "blob",
          headers: {
            Authorization: "Bearer " + accessToken,
          },
        });
        let blobTemp: any = new Blob([response.data], {
          type: "application/zip",
        });
        let fileTemp = new File([blobTemp], fileName, {
          lastModified: new Date().getTime(),
          type: blobTemp.type,
        });
        let result = await restore(fileTemp);
        if (!result) resolve(false);
      } catch (error) {
        console.error("Error occurred during file download:", error);
      }
      resolve(true);
    });
  }
}

export default OneDriveUtil;
