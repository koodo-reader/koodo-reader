import { dropbox_client_id, dropbox_callback_url } from "../../config";
import Dropbox from "dropbox";
import RestoreUtil from "../restoreUtil";

class DropboxUitl {
  static FetchToken() {
    window.open(
      `https://www.dropbox.com/oauth2/authorize?response_type=token&client_id=${dropbox_client_id}&redirect_uri=${dropbox_callback_url}`
    );
  }
  static UploadFile(file, handleFinish, showMessage) {
    var ACCESS_TOKEN = localStorage.getItem("dropbox_access_token") || "";
    var dbx = new Dropbox.Dropbox({ accessToken: ACCESS_TOKEN });
    dbx
      .filesUpload({
        path: "/Apps/KoodoReader/data.zip",
        contents: file,
        mode: "overwrite",
      })
      .then(function (response) {
        console.log(response, "上传成功");
        handleFinish();
      })
      .catch(function (error) {
        console.error(error, "上传失败");
        showMessage("Upload failed, check your connection");
      });
    return false;
  }
  static DownloadFile(handleFinish, showMessage) {
    var ACCESS_TOKEN = localStorage.getItem("dropbox_access_token");
    var dbx = new Dropbox.Dropbox({ accessToken: ACCESS_TOKEN });
    dbx
      .filesDownload({
        path: "/Apps/KoodoReader/data.zip",
      })
      .then(function (data) {
        let file = data.fileBlob;
        console.log(data);
        file.lastModifiedDate = new Date();
        file.name = "data.zip";
        RestoreUtil.restore(file, handleFinish);
      })
      .catch(function (error) {
        showMessage("Download failed,network problem or no backup");

        console.error(error);
      });

    return false;
  }
}

export default DropboxUitl;
