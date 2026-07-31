import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (text, from, to, axios, config) => {
  //https://www.bing.com/translator?from=auto-detect&to=en&text=%E4%BA%8E%E6%98%AF%E4%BB%96%E4%BB%AC%E5%86%99%E4%BA%86%E5%B0%81%E5%9B%9E%E4%BF%A1
  let transUrl = "https://www.bing.com/translator"
  return transUrl + `?from=${from}&to=${to}&text=${encodeURIComponent(text)}`
};
