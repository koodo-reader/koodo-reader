import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (text, from, to, axios, config) => {
  //https://www.reverso.net/text-translation#sl=eng&tl=chi&text=hello%2520world
  let transUrl = "https://www.reverso.net/text-translation"
  return transUrl + `#sl=${from || "auto"}&tl=${to || "chi"}&text=${encodeURIComponent(text)}`
};
