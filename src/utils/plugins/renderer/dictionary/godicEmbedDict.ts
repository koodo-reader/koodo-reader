import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  //https://www.godic.net/dicts/de/dein
  return `https://www.godic.net/dicts/de/${encodeURIComponent(text)}`
};
