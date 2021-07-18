import { unzipBook, unzipConfig } from "./common";

export const restore = (file: any, isSync = false) => {
  return new Promise<boolean>(async (resolve, reject) => {
    let result = await unzipConfig(file);
    if (result) {
      if (isSync) {
        resolve(true);
      } else {
        let res = await unzipBook(file);
        if (res) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    } else {
      resolve(false);
    }
  });
};
