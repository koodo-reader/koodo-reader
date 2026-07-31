import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (text, from, to, axios, config) => {
  //https://fanyi.baidu.com/mtpe-individual/transText?query=hello%20world&lang=en2zh
  let transUrl = "https://fanyi.baidu.com/mtpe-individual/transText"
  return transUrl + `?query=${encodeURIComponent(text)}&lang=${from || "auto"}2${to || "zh"}`
};
