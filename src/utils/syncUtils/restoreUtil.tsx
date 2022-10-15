import { unzipBook, unzipConfig } from "./common";

export const restore = (file: File, isSync = false) => {
  return new Promise<boolean>(async (resolve, reject) => {
    const fs = window.require("fs");
    const path = window.require("path");
    const AdmZip = window.require("adm-zip");
    const dataPath = localStorage.getItem("storageLocation")
      ? localStorage.getItem("storageLocation")
      : window
          .require("electron")
          .ipcRenderer.sendSync("storage-location", "ping");
    var reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async (event) => {
      if (!event.target) return;
      if (!fs.existsSync(path.join(dataPath))) {
        fs.mkdirSync(path.join(dataPath));
      }
      fs.writeFileSync(
        path.join(dataPath, file.name),
        Buffer.from(event.target.result as any)
      );
      var zip = new AdmZip(path.join(dataPath, file.name));
      var zipEntries = zip.getEntries(); // an array of ZipEntry records
      let result = await unzipConfig(zipEntries);
      if (result) {
        if (isSync) {
          resolve(true);
        } else {
          let res = await unzipBook(zipEntries);
          if (res) {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      } else {
        resolve(false);
      }
      const fs_extra = window.require("fs-extra");
      fs_extra.remove(path.join(dataPath, file.name), (err) => {
        if (err) throw err;
      });
    };
  });
};
