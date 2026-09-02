import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (text, from, to, axios, config) => {
  //https://fanyi.sogou.com/text?keyword=hello%20world%0A&transfrom=auto&transto=zh-CHS&model=general
  let transUrl = "https://fanyi.sogou.com/text"
  return transUrl + `?keyword=${encodeURIComponent(text)}&transfrom=${from || "auto"}&transto=${to || "zh-CHS"}&model=general`
};
