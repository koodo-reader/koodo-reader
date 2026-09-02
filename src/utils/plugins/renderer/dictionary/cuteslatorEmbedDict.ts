import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  //https://www.cuteslator.com/dictionary/en/hello/zh
  return `https://www.cuteslator.com/dictionary/${to || "en"}/${encodeURIComponent(text)}/${to === "zh" ? "all" : "zh"}`
};
