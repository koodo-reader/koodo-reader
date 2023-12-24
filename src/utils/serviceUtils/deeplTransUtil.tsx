export const deeplTranlate = async (text, from, to) => {
  const rand = getRandomNumber();
  const body = {
    jsonrpc: "2.0",
    method: "LMT_handle_texts",
    params: {
      splitting: "newlines",
      lang: {
        source_lang_user_selected: from,
        target_lang: to,
      },
      texts: [{ text, requestAlternatives: 3 }],
      timestamp: getTimeStamp(getICount(text)),
    },
    id: rand,
  };

  let body_str = JSON.stringify(body);

  if ((rand + 5) % 29 === 0 || (rand + 3) % 13 === 0) {
    body_str = body_str.replace('"method":"', '"method" : "');
  } else {
    body_str = body_str.replace('"method":"', '"method": "');
  }
  console.log(body_str);
  const axios = window.require("axios");
  let data = body_str;

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://www2.deepl.com/jsonrpc",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "x-app-os-name": "iOS",
      "x-app-os-version": "16.3.0",
      "Accept-Language": "en-US,en;q=0.9",
      "x-app-device": "iPhone13,2",
      "User-Agent": "DeepL-iOS/2.6.0 iOS 16.3.0 (iPhone13,2)",
      "x-app-build": "353933",
      "x-app-version": "2.6",
      Cookie:
        "LMTBID=v2|b9c7fb59-034e-4d1b-9cb1-28bfd29d1f22|10bc46f0a01258d9c33e6c1a02cc3a84",
    },
    data: data,
  };

  let transRes = await axios.request(config);
  let result = transRes.data;
  if (result && result.result && result.result.texts) {
    return result.result.texts[0].text.trim();
  } else {
    return "Error happens";
  }
};

function getTimeStamp(iCount) {
  const ts = Date.now();
  if (iCount !== 0) {
    iCount = iCount + 1;
    return ts - (ts % iCount) + iCount;
  } else {
    return ts;
  }
}

function getICount(translate_text) {
  return translate_text.split("i").length - 1;
}

function getRandomNumber() {
  const rand = Math.floor(Math.random() * 99999) + 100000;
  return rand * 1000;
}
