import { restore } from "./restoreUtil";
import StorageUtil from "../serviceUtils/storageUtil";
import { driveConfig } from "../../constants/driveList";
import axios from "axios";
const getData = (file) =>
  new Promise((resolve, reject) => {
    if (file) {
      const fr = new FileReader();
      fr.onload = (f: any) =>
        resolve({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          data: f.target.result,
        });
      fr.onerror = (err) => reject(err);
      fr.readAsArrayBuffer(file);
    } else {
      resolve({});
    }
  });
// get file list from google drive and return the file id of the file with the file name of "data.zip"
// if the file does not exist, return an empty string
const getFileId = async (accessToken: string) => {
  const url = `https://www.googleapis.com/drive/v3/files?q=name='data.zip'&spaces=appDataFolder&fields=files(id,name)`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    });
    if (response.data.files.length === 0) {
      return "";
    }
    return response.data.files[0].id;
  } catch (error) {
    console.error("Error occurred during file list retrieval:", error);
    return "";
  }
};
class GoogleDriveUtil {
  static UploadFile(blob: any) {
    return new Promise<boolean>(async (resolve, reject) => {
      var refresh_token =
        StorageUtil.getReaderConfig("googledrive_token") || "";
      let res = await axios.post(driveConfig.googleRefreshUrl, {
        refresh_token,
        redirect_uri: driveConfig.callbackUrl,
      });
      const accessToken = res.data.access_token;
      let file = new File([blob], "data.zip", {
        lastModified: new Date().getTime(),
        type: blob.type,
      });
      const fileObj: any = await getData(file);
      if (Object.keys(fileObj).length === 0) {
        console.log("No file.");
        return;
      }

      // 1. Create the session for the resumable upload.
      const metadata = {
        mimeType: fileObj.mimeType,
        name: fileObj.fileName,
        parents: ["appDataFolder"],
      };
      try {
        const response = await axios.post(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
          JSON.stringify(metadata),
          {
            headers: {
              Authorization: "Bearer " + accessToken,
              "Content-Type": "application/json; charset=UTF-8",
            },
          }
        );
        const location = response.headers.location;

        // 2. Upload the data using the retrieved endpoint.
        await axios.put(location, fileObj.data, {
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/zip",
            "Content-Range": `bytes 0-${fileObj.fileSize - 1}/${
              fileObj.fileSize
            }`,
          },
        });
      } catch (error) {
        console.error("Error occurred during upload:", error);
        resolve(false);
      }
      resolve(true);
    });
  }
  static DownloadFile() {
    return new Promise<boolean>(async (resolve, reject) => {
      var refresh_token =
        StorageUtil.getReaderConfig("googledrive_token") || "";
      let res = await axios.post(driveConfig.googleRefreshUrl, {
        refresh_token,
        redirect_uri: driveConfig.callbackUrl,
      });
      const accessToken = res.data.access_token;
      let fileId = await getFileId(accessToken);
      if (!fileId) {
        resolve(false);
      }
      const fileName = "data.zip";
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: "Bearer " + accessToken,
          },
          responseType: "blob",
        });

        const blob = new Blob([response.data], {
          type: response.headers["content-type"],
        });

        let fileTemp = new File([blob], fileName, {
          lastModified: new Date().getTime(),
          type: blob.type,
        });
        let result = await restore(fileTemp);
        if (!result) resolve(false);
      } catch (error) {
        console.error("Error occurred during file download:", error);
      }

      resolve(true);
    });
  }
}

export default GoogleDriveUtil;
