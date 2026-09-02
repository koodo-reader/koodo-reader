import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  //https://dict.eudic.net/dicts/en/hello
  return `https://dict.eudic.net/dicts/en/${encodeURIComponent(text)}`
};
