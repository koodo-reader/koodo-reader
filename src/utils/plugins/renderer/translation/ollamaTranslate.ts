import type { TranslatePlugin } from "../../types";

export const translate: TranslatePlugin = async (
  text,
  from,
  to,
  axios,
  config
) => {
  if (config.url === "") {
    return "Error happened";
  }
  let transUrl = config.url || "http://127.0.0.1:11434/api/generate";
  let headers = {
    "Content-Type": "application/json",
  };
  let transRes = await axios.post(
    transUrl,
    {
      model: config.model || "llama3",
      prompt: `${text} \ntranslate the above sentence to ${to === "en" || to === "Automatic" ? "English" : to}, and only return the content translated. no explanation.`,
      stream: false,
    },
    {
      headers,
    }
  );
  if (transRes.status === 200) {
    return transRes.data.response;
  } else {
    return "Error happened";
  }
};
