import StorageUtil from "./storageUtil";
import Chinese from "chinese-s2t";
import { getIframeDoc } from "./docUtil";
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
        item.innerHTML = item.innerHTML.replace(
          item.innerText,
          Chinese.s2t(item.innerText)
        );
      });
    } else {
      doc.querySelectorAll("p").forEach((item) => {
        item.innerHTML = item.innerHTML.replace(
          item.innerText,
          Chinese.t2s(item.innerText)
        );
      });
    }
  }
};
