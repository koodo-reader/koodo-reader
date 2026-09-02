import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (
  text,
  from,
  to,
  axios,
  config
) => {
  let endpoint =
    config.endpoint || "https://api.cognitive.microsofttranslator.com";
  let apiKey = config.apiKey || "";
  let location = config.location || "";

  let headers = {
    "Ocp-Apim-Subscription-Key": apiKey,
    "Content-Type": "application/json",
  };
  if (location) {
    headers["Ocp-Apim-Subscription-Region"] = location;
  }

  let params = {
    "api-version": "3.0",
    to: to,
  };
  if (from && from !== "") {
    params["from"] = from;
  }

  let transRes = await axios.post(endpoint + "/translate", [{ text }], {
    headers,
    params,
  });
  if (transRes.status === 200) {
    return transRes.data[0].translations[0].text;
  } else {
    return "Error happened";
  }
};
