import StorageUtil from "./storageUtil";
import { getIframeDoc } from "./docUtil";
declare var window: any;

export const tsTransform = () => {
  let doc = getIframeDoc();
  if (!doc) return;
  if (
    StorageUtil.getReaderConfig("convertChinese") &&
    StorageUtil.getReaderConfig("convertChinese") !== "Default"
  ) {
    if (
      StorageUtil.getReaderConfig("convertChinese") ===
      "Simplified To Traditional"
    ) {
      doc.querySelectorAll("p").forEach((item) => {
        item.innerHTML = item.innerHTML
          .split("")
          .map((item) => window.ChineseS2T.s2t(item))
          .join("");
      });
    } else {
      doc.querySelectorAll("p").forEach((item) => {
        item.innerHTML = item.innerHTML
          .split("")
          .map((item) => window.ChineseS2T.t2s(item))
          .join("");
      });
    }
  }
};
