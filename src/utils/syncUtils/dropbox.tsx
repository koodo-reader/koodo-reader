import { restore } from "./restoreUtil";
import OtherUtil from "../otherUtil";

var Dropbox = (window as any).Dropbox;

class DropboxUtil {
  static UploadFile(blob: any) {
    return new Promise<boolean>((resolve, reject) => {
      var ACCESS_TOKEN = OtherUtil.getReaderConfig("dropbox_token") || "";
      var dbx = new Dropbox.Dropbox({ accessToken: ACCESS_TOKEN });
      const file = new File([blob], "data.zip");
      let date = new Date().getTime();
      dbx
        .filesUpload({
          path: `/${date}/data.zip`,
          contents: file,
        })
        .then(function (response: any) {
          console.log(response, "上传成功");
          resolve(true);
        })
        .catch(function (error: any) {
          console.error(error, "上传失败");
          resolve(false);
        });
    });
  }
  static DownloadFile() {
    return new Promise<boolean>((resolve, reject) => {
      var ACCESS_TOKEN = OtherUtil.getReaderConfig("dropbox_token") || "";
      var dbx = new Dropbox.Dropbox({ accessToken: ACCESS_TOKEN });
      dbx
        .filesListFolder({ path: "" })
        .then(function (response) {
          let folderArr: string[] = [];
          response.result.entries.forEach((item) => {
            if (!isNaN(parseInt(item.name))) folderArr.push(item.name);
          });
          let folder = folderArr.sort().reverse()[0];
          dbx
            .filesDownload({
              path: `/${folder}/data.zip`,
            })
            .then(async (data: any) => {
              let file = data.result.fileBlob;
              file.lastModifiedDate = new Date();
              file.name = "data.zip";
              let result = await restore(file);
              if (result) {
                resolve(true);
              } else {
                resolve(false);
              }
            })
            .catch(function (error: any) {
              console.error(error);
              resolve(false);
            });
        })
        .catch(function (error) {
          console.error(error);
        });
    });
  }
}

export default DropboxUtil;
