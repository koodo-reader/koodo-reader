import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (text, from, to, axios, config) => {
  //https://fanyi.baidu.com/#auto/zh/hello%20world
  let transUrl = "https://fanyi.baidu.com/"
  return transUrl + `#${from || "auto"}/${to || "zh"}/${encodeURIComponent(text)}`
};
