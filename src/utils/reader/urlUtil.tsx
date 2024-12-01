import { isElectron } from "react-device-detect";
import ConfigService from "../service/configService";

export const openExternalUrl = (url: string) => {
  isElectron
    ? ConfigService.getReaderConfig("isUseBuiltIn") === "yes"
      ? window.open(url)
      : window.require("electron").shell.openExternal(url)
    : window.open(url);
};
