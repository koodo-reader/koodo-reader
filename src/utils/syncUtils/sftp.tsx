import { restore } from "./restoreUtil";
import StorageUtil from "../serviceUtils/storageUtil";

class SftpUtil {
  static UploadFile = async (file: ArrayBuffer) => {
    return new Promise<boolean>(async (resolve, reject) => {
      let Client = window.require("ssh2-sftp-client");
      let sftp = new Client();

      let { url, port, username, password } = JSON.parse(
        StorageUtil.getReaderConfig("webdav_token") || ""
      );
      sftp
        .connect({
          host: url,
          port: port,
          username: username,
          password: password,
        })
        .then(() => {
          return sftp.exists("/KoodoReader");
        })
        .then((data) => {
          if (!data) {
            sftp
              .mkdir("/KoodoReader", true)
              .then(() =>
                sftp.append(Buffer.from(file), "/KoodoReader/data.zip")
              );
          } else {
            return sftp.append(Buffer.from(file), "/KoodoReader/data.zip");
          }
        })
        .then(() => {
          let year = new Date().getFullYear(),
            month = new Date().getMonth() + 1,
            day = new Date().getDate();
          return sftp.rcopy(
            "/KoodoReader/data.zip",
            "/KoodoReader/" +
              `${year}-${month <= 9 ? "0" + month : month}-${
                day <= 9 ? "0" + day : day
              }.zip`
          );
        })
        .then(() => {
          sftp.end();
        })
        .catch((err) => {
          console.log(err, "catch error");
        });
    });
  };
  static DownloadFile = async () => {
    return new Promise<boolean>(async (resolve, reject) => {
      let Client = window.require("ssh2-sftp-client");
      const fs = window.require("fs");
      const path = window.require("path");
      let sftp = new Client();
      const { ipcRenderer } = window.require("electron");
      const dirPath = ipcRenderer.sendSync("user-data", "ping");

      let { url, port, username, password } = JSON.parse(
        StorageUtil.getReaderConfig("webdav_token") || ""
      );
      sftp
        .connect({
          host: url,
          port: port,
          username: username,
          password: password,
        })
        .then(() => {
          return sftp.exists("/KoodoReader");
        })
        .then((data) => {
          if (!data) {
            sftp.end();
          } else {
            sftp.fastGet(
              "/KoodoReader/data.zip",
              path.join(dirPath, `data.zip`)
            );
          }
        })
        .then(async () => {
          var data = fs.readFileSync(path.join(dirPath, `data.zip`));
          let blobTemp: any = new Blob([data], { type: "application/zip" });
          let fileTemp = new File([blobTemp], "data.zip", {
            lastModified: new Date().getTime(),
            type: blobTemp.type,
          });
          let result = await restore(fileTemp);
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
        })
        .then(() => {
          sftp.end();
        })
        .catch((err) => {
          console.log(err, "catch error");
        });
    });
  };
}

export default SftpUtil;
