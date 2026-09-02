import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  return `https://${to === "en" ? "ejje" : to}.weblio.jp/content/${encodeURIComponent(text)}`
};
