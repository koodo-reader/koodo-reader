import { restore } from "./restoreUtil";
import StorageUtil from "../serviceUtils/storageUtil";

class WebdavUtil {
  static UploadFile = async (blob: any) => {
    return new Promise<boolean>(async (resolve, reject) => {
      let file = new File([blob], "data.zip", {
        lastModified: new Date().getTime(),
        type: blob.type,
      });
      const { createClient } = window.require("webdav");
      let { url, username, password } = JSON.parse(
        StorageUtil.getReaderConfig("webdav_token") || "{}"
      );
      const client = createClient(url, {
        username,
        password,
      });
      var wfs = window.require("webdav-fs")(url, {
        username: username,
        password: password,
      });
      if ((await client.exists("/KoodoReader")) === false) {
        await client.createDirectory("/KoodoReader");
      }
      wfs.writeFile("/KoodoReader/data.zip", file, "binary", function (err) {
        console.log(err);
        if (err) resolve(false);
        resolve(true);
      });
    });
  };
  static DownloadFile = async () => {
    return new Promise<boolean>(async (resolve, reject) => {
      const { createClient } = window.require("webdav");
      let { url, username, password } = JSON.parse(
        StorageUtil.getReaderConfig("webdav_token") || ""
      );
      const client = createClient(url, {
        username,
        password,
      });
      if ((await client.exists("/KoodoReader/data.zip")) === false) {
        resolve(false);
      }
      const buffer: Buffer = await client.getFileContents(
        "/KoodoReader/data.zip"
      );
      console.log(buffer);
      let blobTemp: any = new Blob([buffer], { type: "application/zip" });
      let fileTemp = new File([blobTemp], "data.zip", {
        lastModified: new Date().getTime(),
        type: blobTemp.type,
      });
      console.log(fileTemp);
      let result = await restore(fileTemp);
      if (!result) resolve(false);
      resolve(true);
    });
  };
}

export default WebdavUtil;
