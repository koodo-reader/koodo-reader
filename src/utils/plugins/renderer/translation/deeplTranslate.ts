import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (
  text,
  from,
  to,
  axios,
  config
) => {
  let transUrl =
    config.keyType === "free"
      ? "https://api-free.deepl.com/v2/translate"
      : "https://api.deepl.com/v2/translate";
  let headers = {
    Authorization: "DeepL-Auth-Key " + config.apiKey,
  };
  let transRes = await axios.post(
    transUrl,
    { text: [text], source_lang: from, target_lang: to },
    {
      headers,
    }
  );
  if (transRes.status === 200) {
    return transRes.data.translations[0].text;
  } else {
    return "Error happened";
  }
};
