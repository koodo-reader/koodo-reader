import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  let transUrl = "https://dict.youdao.com/result?word="
  return transUrl + `${encodeURIComponent(text)}&lang=${to}`
};
