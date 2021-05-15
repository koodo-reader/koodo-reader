import RestoreUtil from "./restoreUtil";
import OtherUtil from "../otherUtil";

class WebdavUtil {
  static UploadFile = async (
    file: any,
    handleFinish: () => void,
    showMessage: (message: string) => void
  ) => {
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
      if (err) showMessage("Upload failed, check your connection");
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
          handleFinish();
        })
        .catch(() => {
          showMessage("Upload failed, check your connection");
        });
    });

    return false;
  };
  static DownloadFile = async (
    handleFinish: () => void,
    showMessage: (message: string) => void
  ) => {
    const fs = window.require("fs");
    const path = window.require("path");
    const { createClient } = window.require("webdav");
    const { remote, app } = window.require("electron");
    const configDir = (app || remote.app).getPath("userData");
    const dirPath = path.join(configDir, "uploads");
    const request = window.require("request");
    let { url, username, password } = JSON.parse(
      OtherUtil.getReaderConfig("webdav_token") || ""
    );
    const client = createClient(url, {
      username,
      password,
    });
    if ((await client.exists("/KoodoReader/data.zip")) === false) {
      showMessage("Download failed,network problem or no backup");
    }
    const downloadLink: string = client.getFileDownloadLink(
      "/KoodoReader/data.zip"
    );
    let stream = fs.createWriteStream(path.join(dirPath, `data.zip`));
    request(downloadLink)
      .pipe(stream)
      .on("close", function (err) {
        if (err) {
          console.log(err);
        } else {
          var data = fs.readFileSync(path.join(dirPath, `data.zip`));
          let blobTemp: any = new Blob([data], { type: "application/zip" });
          let fileTemp = new File([blobTemp], "data.zip", {
            lastModified: new Date().getTime(),
            type: blobTemp.type,
          });
          RestoreUtil.restore(fileTemp, handleFinish);
          try {
            const fs_extra = window.require("fs-extra");
            fs_extra.remove(path.join(dirPath, `data.zip`), (error: any) => {
              if (error) throw error;
            });
          } catch (e) {
            console.log("error removing ", path.join(dirPath, `data.zip`));
          }
        }
      });

    return false;
  };
}

export default WebdavUtil;
