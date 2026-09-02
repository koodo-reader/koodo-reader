import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (text, from, to, axios, config) => {
  let transUrl = "http://127.0.0.1:60828/translate"
  if (config.host && config.port) {
    transUrl = `http://${config.host}:${config.port}/translate`
  }
  let res = await axios.post(transUrl, text);
  if (res.data === "ok") {
    return "Pot is running"
  } else {
    return "Error happened"
  }
};
