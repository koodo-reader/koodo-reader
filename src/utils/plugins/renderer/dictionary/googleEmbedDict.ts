import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  let transUrl = "https://www.google.com/search?q=define+"
  return transUrl + `${encodeURIComponent(text)}`
};
