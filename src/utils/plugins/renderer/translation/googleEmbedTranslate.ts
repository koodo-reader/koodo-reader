import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (text, from, to, axios, config) => {
  let transUrl = "https://translate.google.com/"
  return transUrl + `?sl=${from}&tl=${to}&text=${encodeURIComponent(text)}&op=translate`
};
