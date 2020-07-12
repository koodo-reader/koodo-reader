import Dropbox from "dropbox";
import RestoreUtil from "../restoreUtil";

class DropboxUitl {
  static FetchToken() {
    window.open(
      `https://www.dropbox.com/oauth2/authorize?response_type=token&client_id=e3zgg310xbizvaf&redirect_uri=https://reader.960960.xyz`
    );
  }
  static UploadFile(
    file: any,
    handleFinish: () => void,
    showMessage: (message: string) => void
  ) {
    var ACCESS_TOKEN = localStorage.getItem("dropbox_access_token") || "";
    var dbx = new Dropbox.Dropbox({ accessToken: ACCESS_TOKEN });
    dbx
      .filesUpload({
        path: "/Apps/KoodoReader/data.zip",
        contents: file,
        mode: { ".tag": "overwrite" },
      })
      .then(function (response: any) {
        console.log(response, "上传成功");
        handleFinish();
      })
      .catch(function (error: any) {
        console.error(error, "上传失败");
        showMessage("Upload failed, check your connection");
      });
    return false;
  }
  static DownloadFile(
    handleFinish: () => void,
    showMessage: (message: string) => void
  ) {
    var ACCESS_TOKEN = localStorage.getItem("dropbox_access_token") || "";
    var dbx = new Dropbox.Dropbox({ accessToken: ACCESS_TOKEN });
    dbx
      .filesDownload({
        path: "/Apps/KoodoReader/data.zip",
      })
      .then(function (data: any) {
        let file = data.fileBlob;
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
