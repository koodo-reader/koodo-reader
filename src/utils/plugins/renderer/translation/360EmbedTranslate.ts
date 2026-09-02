import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (text, from, to, axios, config) => {
  //https://fanyi.so.com/#Hello%2C%20world
  let transUrl = "https://fanyi.so.com"
  return transUrl + `/#${encodeURIComponent(text)}`
};
