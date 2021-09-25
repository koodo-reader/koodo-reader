import { restore } from "./restoreUtil";
import OtherUtil from "../otherUtil";

class WebdavUtil {
  static UploadFile = async (file: any) => {
    return new Promise<boolean>(async (resolve, reject) => {
      const { createClient } = window.require("webdav");
      let { url, username, password } = JSON.parse(
        OtherUtil.getReaderConfig("webdav_token") || ""
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
        let year = new Date().getFullYear(),
          month = new Date().getMonth() + 1,
          day = new Date().getDate();
        client
          .copyFile(
            "/KoodoReader/data.zip",
            "/KoodoReader/" +
              `${year}-${month <= 9 ? "0" + month : month}-${
                day <= 9 ? "0" + day : day
              }.zip`
          )
          .then(() => {
            resolve(true);
          })
          .catch(() => {
            resolve(false);
          });
      });
    });
  };
  static DownloadFile = async () => {
    return new Promise<boolean>(async (resolve, reject) => {
      const fs = window.require("fs");
      const path = window.require("path");
      const { createClient } = window.require("webdav");
      const { ipcRenderer } = window.require("electron");
      const dirPath = ipcRenderer.sendSync("user-data", "ping");
      const request = window.require("request");
      let { url, username, password } = JSON.parse(
        OtherUtil.getReaderConfig("webdav_token") || ""
      );
      const client = createClient(url, {
        username,
        password,
      });
      if ((await client.exists("/KoodoReader/data.zip")) === false) {
        resolve(false);
      }
      const downloadLink: string = client.getFileDownloadLink(
        "/KoodoReader/data.zip"
      );
      let stream = fs.createWriteStream(path.join(dirPath, `data.zip`));
      request(downloadLink)
        .pipe(stream)
        .on("close", async (err) => {
          if (err) {
            console.log(err);
            resolve(false);
          } else {
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
          }
        });
    });
  };
}

export default WebdavUtil;
