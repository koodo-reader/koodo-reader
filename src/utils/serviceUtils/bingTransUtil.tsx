import axios from "axios";

export const bingTranslate = async (text: string, from: string, to: string) => {
  let authUrl = "https://edge.microsoft.com/translate/auth";
  let transUrl =
    "https://api-edge.cognitive.microsofttranslator.com/translate?api-version=3.0&from=" +
    from +
    "&to=" +
    to;
  let authRes = await axios.get(authUrl);
  if (authRes.status === 200) {
    let token = authRes.data;
    let headers = {
      accept: "*/*",
      "accept-language":
        "zh-TW,zh;q=0.9,ja;q=0.8,zh-CN;q=0.7,en-US;q=0.6,en;q=0.5",
      authorization: "Bearer " + token,
      "cache-control": "no-cache",
      "content-type": "application/json",
      pragma: "no-cache",
      "sec-ch-ua":
        '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      Referer: "https://github.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42",
    };
    let transRes = await axios.post(transUrl, [{ Text: text }], {
      headers,
    });
    if (transRes.status === 200) {
      return transRes.data[0].translations[0].text;
    } else {
      return "Error happens";
    }
  } else {
    return "Error happens";
  }
};
