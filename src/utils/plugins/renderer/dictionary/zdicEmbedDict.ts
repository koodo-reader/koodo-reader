import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  return `https://www.zdic.net/hans/${encodeURIComponent(text)}`
};
