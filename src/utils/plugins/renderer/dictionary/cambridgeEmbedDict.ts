import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  //https://dictionary.cambridge.org/dictionary/english-danish/hello
  let transUrl = "https://dictionary.cambridge.org/dictionary/"
  return transUrl + `english${to === "en" ? "" : "-" + to}/${encodeURIComponent(text)}`
};
