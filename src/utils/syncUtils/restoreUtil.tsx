declare var window: any;

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
          let res2 = await unzipCover(zipEntries);
          if (res || res2) {
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
export const unzipConfig = async (zipEntries: any) => {
  // no longer support backup from older version
  if (
    zipEntries
      .map((item: any) => item.entryName)
      .indexOf("config/config.json") === -1
  ) {
    return false;
  }
  let flag = true;
  for (let i = 0; i < zipEntries.length; i++) {
    if (
      zipEntries[i].entryName.startsWith("config/") &&
      !zipEntries[i].isDirectory
    ) {
      let text = zipEntries[i].getData().toString("utf8");
      if (!text) {
        flag = false;
        break;
      }
      if (zipEntries[i].name === "config.json") {
        let config = JSON.parse(text);
        for (let key in config) {
          localStorage.setItem(key, config[key]);
        }
      } else {
        await window.localforage.setItem(
          zipEntries[i].name.split(".")[0],
          JSON.parse(text)
        );
      }
    }
  }
  return flag;
};

export const unzipBook = async (zipEntries: any) => {
  const fs = window.require("fs");
  const path = window.require("path");
  const dataPath = localStorage.getItem("storageLocation")
    ? localStorage.getItem("storageLocation")
    : window
        .require("electron")
        .ipcRenderer.sendSync("storage-location", "ping");

  if (!fs.existsSync(path.join(dataPath, "book"))) {
    fs.mkdirSync(path.join(dataPath, "book"));
  }
  let flag = true;
  for (let i = 0; i < zipEntries.length; i++) {
    if (
      zipEntries[i].entryName.startsWith("book/") &&
      !zipEntries[i].isDirectory
    ) {
      let buffer = zipEntries[i].getData();
      if (!buffer) {
        flag = false;
        break;
      }
      fs.writeFileSync(path.join(dataPath, "book", zipEntries[i].name), buffer);
    }
  }
  return flag;
};
export const unzipCover = async (zipEntries: any) => {
  const fs = window.require("fs");
  const path = window.require("path");
  const dataPath = localStorage.getItem("storageLocation")
    ? localStorage.getItem("storageLocation")
    : window
        .require("electron")
        .ipcRenderer.sendSync("storage-location", "ping");

  if (!fs.existsSync(path.join(dataPath, "cover"))) {
    fs.mkdirSync(path.join(dataPath, "cover"));
  }
  let flag = true;
  for (let i = 0; i < zipEntries.length; i++) {
    if (
      zipEntries[i].entryName.startsWith("cover/") &&
      !zipEntries[i].isDirectory
    ) {
      let buffer = zipEntries[i].getData();
      if (!buffer) {
        flag = false;
        break;
      }
      fs.writeFileSync(
        path.join(dataPath, "cover", zipEntries[i].name),
        buffer
      );
    }
  }
  return flag;
};
