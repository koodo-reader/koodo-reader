import Dropbox from "dropbox";
import RestoreUtil from "../restoreUtil";
import OtherUtil from "../otherUtil";

class DropboxUitl {
  static UploadFile(
    file: any,
    handleFinish: () => void,
    showMessage: (message: string) => void
  ) {
    var ACCESS_TOKEN = OtherUtil.getReaderConfig("dropbox_token") || "";
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
    var ACCESS_TOKEN = OtherUtil.getReaderConfig("dropbox_token") || "";
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
