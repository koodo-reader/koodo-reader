import RestoreUtil from "./restoreUtil";
import OtherUtil from "../otherUtil";

class WebdavUtil {
  static UploadFile = async (
    file: any,
    handleFinish: () => void,
    showMessage: (message: string) => void
  ) => {
    const fs = window.require("fs");
    const path = window.require("path");
    const { createClient } = window.require("webdav");
    const { remote, app } = window.require("electron");
    const configDir = (app || remote.app).getPath("userData");
    const dirPath = path.join(configDir, "uploads");
    let { url, username, password } = JSON.parse(
      OtherUtil.getReaderConfig("webdav_token") || ""
    );
    const client = createClient(url, {
      username,
      password,
    });
    var reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async (event) => {
      fs.writeFileSync(
        path.join(dirPath, file.name),
        Buffer.from(event.target!.result as any)
      );
      if ((await client.exists("/KoodoReader")) === false) {
        await client.createDirectory("/KoodoReader");
      }
      let year = new Date().getFullYear(),
        month = new Date().getMonth() + 1,
        day = new Date().getDate();
      let Datastream = client.createWriteStream(
        "/KoodoReader/data.zip",
        {},
        () => {
          fs.createReadStream(path.join(dirPath, file.name)).pipe(
            historystream
          );
        }
      );
      let historystream = client.createWriteStream(
        "/KoodoReader/" +
          `${year}-${month <= 9 ? "0" + month : month}-${
            day <= 9 ? "0" + day : day
          }.zip`,
        {},
        () => {
          const fs = window.require("fs-extra");
          fs.remove(path.join(dirPath, file.name), (err) => {
            if (err) showMessage("Upload failed, check your connection");
            console.log("successfully data deleted");
          });
          handleFinish();
        }
      );
      fs.createReadStream(path.join(dirPath, file.name)).pipe(Datastream);
    };

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
            const fs = window.require("fs-extra");
            fs.remove(path.join(dirPath, `data.zip`), (err) => {
              if (err) throw err;
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
