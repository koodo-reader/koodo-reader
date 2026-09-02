import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  //https://www.merriam-webster.com/dictionary/failed
  let transUrl = "https://www.merriam-webster.com/dictionary/"
  return transUrl + `${encodeURIComponent(text)}`
};
