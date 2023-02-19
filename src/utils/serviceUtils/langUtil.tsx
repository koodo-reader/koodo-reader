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
      console.log(window);
      doc.querySelectorAll("p").forEach((item) => {
        item.innerHTML = item.innerHTML
          .split("")
          .map((item) => window.ChineseS2T.s2t(item))
          .join("");
        // item.innerHTML = item.innerHTML.replace(
        //   item.innerText,
        //   Chinese.s2t(item.innerText)
        // );
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
