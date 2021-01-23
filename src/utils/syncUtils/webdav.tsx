import RestoreUtil from "../restoreUtil";
import OtherUtil from "../otherUtil";
import axios from "axios";
import { config } from "../../constants/driveList";

class WebdavUitl {
  static UploadFile = async (
    file: any,
    handleFinish: () => void,
    showMessage: (message: string) => void
  ) => {
    let { url, username, password } = JSON.parse(
      OtherUtil.getReaderConfig("webdav_token") || ""
    );
    let formData = new FormData();
    formData.append("file", file);
    formData.append("url", url);
    formData.append("username", username);
    formData.append("password", password);

    axios
      .post(`${config.token_url}/webdav_upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
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
  };
  static DownloadFile(
    handleFinish: () => void,
    showMessage: (message: string) => void
  ) {
    let { url, username, password } = JSON.parse(
      OtherUtil.getReaderConfig("webdav_token") || ""
    );
    let formData = new FormData();
    formData.append("url", url);
    formData.append("username", username);
    formData.append("password", password);

    axios
      .post(`${config.token_url}/webdav_download`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
      })
      .then(function (res: any) {
        let type = "application/octet-stream";
        let blobTemp: any = new Blob([res.data], { type: type });
        let fileTemp = new File([blobTemp], "data.zip", {
          lastModified: new Date().getTime(),
          type: blobTemp.type,
        });

        RestoreUtil.restore(fileTemp, handleFinish);
      })
      .catch(function (error: any) {
        showMessage("Download failed,network problem or no backup");
        console.error(error);
      });

    return false;
  }
}

export default WebdavUitl;
