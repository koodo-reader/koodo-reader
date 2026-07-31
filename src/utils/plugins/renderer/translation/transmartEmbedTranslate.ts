import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (text, from, to, axios, config) => {
  //https://transmart.qq.com/zh-CN/index?sourcelang=en&targetlang=zh&source=hello%20world
  let transUrl = "https://transmart.qq.com/zh-CN/index"
  return transUrl + `?sourcelang=${from || "auto"}&targetlang=${to || "zh"}&source=${encodeURIComponent(text)}`
};
