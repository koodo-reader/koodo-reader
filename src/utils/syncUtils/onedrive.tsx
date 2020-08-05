import Dropbox from "dropbox";
import RestoreUtil from "../restoreUtil";
import OtherUtil from "../otherUtil";
import axios from "axios";
import { config } from "../readerConfig";
var oneDriveAPI = require("onedrive-api");

class OnedriveUitl {
  static GetAccessToken() {
    const code: string = OtherUtil.getReaderConfig("onedrive_token");
    axios
      .get(
        `${config.token_url}/onedrive?code=${code}&&redirect_uri=${config.callback_url}`
      )
      .then((res: any) => {
        OtherUtil.setReaderConfig(
          "onedrive_access_token",
          res.data.access_token
        );
        OtherUtil.setReaderConfig(
          "onedrive_refresh_token",
          res.data.refresh_token
        );
      })
      .catch((err) => {
        console.log(err);
      });
  }
  static RefreshAccessToken(showMessage: (message: string) => void) {
    showMessage("Refreshing Access Token");
    const refresh_token: string = OtherUtil.getReaderConfig(
      "onedrive_refresh_token"
    );
    axios
      .get(
        `${config.token_url}/onedrive_refresh?refresh_token=${refresh_token}&&redirect_uri=${config.callback_url}`
      )
      .then((res: any) => {
        OtherUtil.setReaderConfig(
          "onedrive_access_token",
          res.data.access_token
        );
        OtherUtil.setReaderConfig(
          "onedrive_refresh_token",
          res.data.refresh_token
        );
        showMessage("Access token received");
      })
      .catch((err) => {
        console.log(err);
      });
  }
  static UploadFile(
    file: any,
    handleFinish: () => void,
    showMessage: (message: string) => void
  ) {
    var ACCESS_TOKEN = OtherUtil.getReaderConfig("onedrive_access_token") || "";
    oneDriveAPI.items
      .uploadSession({
        accessToken: ACCESS_TOKEN,
        filename: "data.zip",
        fileSize: file.size,
        readableStream: new ReadableStream(),
        parentPath: "/Apps/KoodoReader/",
      })
      .then((item: any) => {
        console.log(item);
        handleFinish();
        showMessage("Upload Successfully");
        // returns body of https://docs.microsoft.com/en-us/onedrive/developer/rest-api/api/driveitem_createuploadsession?view=odsp-graph-online#http-response
      })
      .catch((err: any) => {
        if (err.statusCode === 401) {
          this.RefreshAccessToken(showMessage);
        }
        console.log(err);
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

export default OnedriveUitl;
