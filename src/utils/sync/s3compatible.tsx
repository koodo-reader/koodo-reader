import { restoreFromfilePath } from "../file/restore";
import StorageUtil from "../service/configService";

class S3Util {
  static UploadFile = async (blob: any) => {
    return new Promise<boolean>(async (resolve, reject) => {
      let { endpoint, region, bucketName, accessKeyId, secretAccessKey } =
        JSON.parse(StorageUtil.getReaderConfig("s3compatible_token") || "{}");
      const fs = window.require("fs");
      const path = window.require("path");
      const { ipcRenderer } = window.require("electron");
      const dirPath = ipcRenderer.sendSync("user-data", "ping");
      const arrayBuffer = await blob.arrayBuffer();
      const fileName = "data.zip";
      fs.writeFileSync(path.join(dirPath, fileName), Buffer.from(arrayBuffer));
      resolve(
        await ipcRenderer.invoke("s3-upload", {
          endpoint,
          region,
          bucketName,
          accessKeyId,
          secretAccessKey,
          fileName,
        })
      );
    });
  };
  static DownloadFile = async () => {
    return new Promise<boolean>(async (resolve, reject) => {
      const fileName = "data.zip";
      const path = window.require("path");
      const { ipcRenderer } = window.require("electron");
      let { endpoint, region, bucketName, accessKeyId, secretAccessKey } =
        JSON.parse(StorageUtil.getReaderConfig("s3compatible_token") || "{}");
      const dirPath = ipcRenderer.sendSync("user-data", "ping");
      let result = await ipcRenderer.invoke("s3-download", {
        endpoint,
        region,
        bucketName,
        accessKeyId,
        secretAccessKey,
        fileName,
      });
      if (result) {
        let result = await restoreFromfilePath(path.join(dirPath, fileName));
        if (!result) resolve(false);
      }
      resolve(true);
      try {
        const fs_extra = window.require("fs-extra");
        fs_extra.remove(path.join(dirPath, fileName), (error: any) => {
          if (error) resolve(false);
          resolve(true);
        });
      } catch (e) {
        console.log("error removing ", path.join(dirPath, fileName));
        resolve(false);
      }
    });
  };
}

export default S3Util;
