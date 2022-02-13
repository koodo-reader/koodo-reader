import { isElectron } from "react-device-detect";
import StorageUtil from "./storageUtil";

export const openExternalUrl = (url: string) => {
  isElectron
    ? StorageUtil.getReaderConfig("isUseBuiltIn") === "yes"
      ? window.open(url)
      : window.require("electron").shell.openExternal(url)
    : window.open(url);
};
