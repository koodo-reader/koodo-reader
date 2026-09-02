import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  //https://cn.bing.com/dict?mkt=zh-CN&&q=hello
  let transUrl = "https://cn.bing.com/dict?mkt=zh-CN&q="
  return transUrl + `${encodeURIComponent(text)}`
};
