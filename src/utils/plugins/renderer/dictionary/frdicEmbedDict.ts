import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  //https://www.frdic.com/dicts/fr/%C3%A9tait
  return `https://www.frdic.com/dicts/fr/${encodeURIComponent(text)}`
};
