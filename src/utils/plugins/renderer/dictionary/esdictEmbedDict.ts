import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  //https://www.esdict.cn/dicts/es/a%C3%B1os
  return `https://www.esdict.cn/dicts/es/${encodeURIComponent(text)}`
};
