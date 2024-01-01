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
      const accessToken = res.data.access_token; // 替换为实际的访问令牌
      const uploadSessionUrl =
        "https://graph.microsoft.com/v1.0/me/drive/root:/Apps/KoodoReader/" +
        file.name +
        ":/createUploadSession";

      try {
        // 创建上传会话
        const sessionResponse = await axios.post(uploadSessionUrl, null, {
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json",
          },
        });

        const uploadUrl = sessionResponse.data.uploadUrl;

        // 上传整个文件
        const response = await axios.put(uploadUrl, file, {
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": file.type,
          },
        });

        console.log("File uploaded successfully:", response.data);
      } catch (error) {
        console.error("Error occurred during file upload:", error);
        resolve(false);
      }
      resolve(true);
    });
  }
  static DownloadFile() {
    return new Promise<boolean>(async (resolve, reject) => {
      var refresh_token = StorageUtil.getReaderConfig("onedrive_token") || "";
      let res = await axios.post(driveConfig.onedriveRefreshUrl, {
        refresh_token,
        redirect_uri: driveConfig.callbackUrl,
      });
      const accessToken = res.data.access_token; // 替换为实际的访问令牌
      const downloadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/Apps/KoodoReader/data.zip:/content`;

      try {
        const response = await axios.get(downloadUrl, {
          headers: {
            Authorization: "Bearer " + accessToken,
            responseType: "blob", // 设置响应类型为 Blob
          },
        });

        // 从响应中获取文件内容
        const fileContent = response.data;
        let fileTemp = new File([fileContent], "data.zip", {
          lastModified: new Date().getTime(),
          type: fileContent.type,
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
