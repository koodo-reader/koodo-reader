import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  //https://baike.baidu.com/item/%E7%A5%9E%E8%88%9F%E4%BA%8C%E5%8D%81%E5%8F%B7
  return `https://baike.baidu.com/item/${encodeURIComponent(text)}`
};
