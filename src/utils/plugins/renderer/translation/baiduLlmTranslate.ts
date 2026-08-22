import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (
  text,
  from,
  to,
  axios,
  config
) => {
  let transUrl = "https://fanyi-api.baidu.com/ait/api/aiTextTranslate";
  let headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + config.apiKey,
  };
  let transRes = await axios.post(
    transUrl,
    { appid: config.appId, from: from, to: to, q: text },
    {
      headers,
    }
  );
  if (transRes.status === 200) {
    return transRes.data.trans_result[0].dst;
  } else {
    return "Error happened";
  }
};
