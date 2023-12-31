import { v4 as uuidv4 } from "uuid";
export const yandexTranslate = async (text, from, to) => {
  const axios = require("axios");
  const qs = require("qs");
  let data = qs.stringify({
    source_lang: from,
    target_lang: to,
    text: text,
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url:
      "https://translate.yandex.net/api/v1/tr.json/translate?id=" +
      uuidv4().replaceAll("-", "") +
      "-0-0" +
      "&srv=android",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: data,
  };

  let transRes = await axios.request(config);
  let result = transRes.data;
  if (result && result.text) {
    return result.text[0].trim();
  } else {
    return "Error happens";
  }
};
