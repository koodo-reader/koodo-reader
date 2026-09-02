import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  //https://www.collinsdictionary.com/dictionary/english-spanish/hello
  return `https://www.collinsdictionary.com/dictionary/english${to === "en" ? "" : "-" + to}/${encodeURIComponent(text)}`
};
