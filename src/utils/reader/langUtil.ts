import ConfigService from "../storage/configService";
import { getIframeDoc } from "./docUtil";
import Chinese from "chinese-s2t";

export const tsTransform = () => {
  let doc = getIframeDoc();
  if (!doc) return;
  if (
    ConfigService.getReaderConfig("convertChinese") &&
    ConfigService.getReaderConfig("convertChinese") !== "Default"
  ) {
    if (
      ConfigService.getReaderConfig("convertChinese") ===
      "Simplified To Traditional"
    ) {
      doc.querySelectorAll("p").forEach((item) => {
        item.innerHTML = item.innerHTML
          .split("")
          .map((item) => Chinese.s2t(item))
          .join("");
      });
    } else {
      doc.querySelectorAll("p").forEach((item) => {
        item.innerHTML = item.innerHTML
          .split("")
          .map((item) => Chinese.t2s(item))
          .join("");
      });
    }
  }
};
