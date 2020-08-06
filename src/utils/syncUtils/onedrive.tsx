import RestoreUtil from "../restoreUtil";
import OtherUtil from "../otherUtil";
import axios from "axios";
import { config } from "../readerConfig";

class OnedriveUitl {
  static GetAccessToken() {
    const code: string = OtherUtil.getReaderConfig("onedrive_token");
    axios
      .get(
        `${config.token_url}/onedrive_get?code=${code}&&redirect_uri=${config.callback_url}`
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
        showMessage("Access token received, please continue");
      })
      .catch((err) => {
        showMessage("Fetching Acess token failed");
        console.log(err);
      });
  }
  static UploadFile(
    file: any,
    handleFinish: () => void,
    showMessage: (message: string) => void
  ) {
    var ACCESS_TOKEN = OtherUtil.getReaderConfig("onedrive_access_token") || "";
    let formData = new FormData();
    formData.append("file", file);
    formData.append("ACCESS_TOKEN", ACCESS_TOKEN);
    axios
      .post(`${config.token_url}/onedrive_upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        OtherUtil.setReaderConfig("onedrive_backup_id", res.data.data.id);
        handleFinish();
      })
      .catch((err) => {
        if (
          err.response &&
          err.response.status &&
          err.response.status === 401
        ) {
          this.RefreshAccessToken(showMessage);
        } else {
          showMessage("Upload failed, check your connection");
        }
      });
    return false;
  }
  static DownloadFile(
    handleFinish: () => void,
    showMessage: (message: string) => void
  ) {
    var ACCESS_TOKEN = OtherUtil.getReaderConfig("onedrive_access_token") || "";
    var backupId = OtherUtil.getReaderConfig("onedrive_backup_id") || "";
    let formData = new FormData();
    formData.append("ACCESS_TOKEN", ACCESS_TOKEN);
    formData.append("backupId", backupId);
    axios
      .post(`${config.token_url}/onedrive_download`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
      })
      .then((data) => {
        if (data.data.error) {
          this.RefreshAccessToken(showMessage);
        } else {
          let type = "application/octet-stream";
          let file: any = new Blob([data.data], { type: type });
          file.lastModifiedDate = new Date();
          file.name = "data.zip";
          RestoreUtil.restore(file, handleFinish);
        }
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          this.RefreshAccessToken(showMessage);
        } else {
          showMessage("Download failed,network problem or no backup");
        }
        console.log(err);
      });
    return false;
  }
}

export default OnedriveUitl;
