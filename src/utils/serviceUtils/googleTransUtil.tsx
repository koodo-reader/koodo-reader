import axios from "axios";

export async function googleTranslate(text: string, from: string, to: string) {
  let res = await axios.get(
    `https://translate.google.com/translate_a/single?dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&${objectToQueryString(
      {
        client: "gtx",
        sl: from,
        tl: to,
        hl: to,
        ie: "UTF-8",
        oe: "UTF-8",
        otf: "1",
        ssel: "0",
        tsel: "0",
        kc: "7",
        q: text,
      }
    )}`,
    { headers: { "content-type": "application/json" } }
  );

  let result = res.data;
  if (result[1]) {
    let target: any = {
      pronunciations: [],
      explanations: [],
      associations: [],
      sentence: [],
      audios: [],
    };
    if (result[0][1][3]) {
      target.pronunciations.push({ symbol: result[0][1][3], voice: "" });
    }
    for (let i of result[1]) {
      target.explanations.push({
        trait: i[0],
        explains: i[2].map((x) => {
          return x[0];
        }),
      });
    }
    if (result[13]) {
      for (let i of result[13][0]) {
        target.sentence.push({ source: i[0] });
      }
    }
    return target;
  } else {
    let target = "";
    for (let r of result[0]) {
      if (r[0]) {
        target = target + r[0];
      }
    }
    return target.trim();
  }
}

function objectToQueryString(obj) {
  const queryParams: any = [];

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(value);
      queryParams.push(`${encodedKey}=${encodedValue}`);
    }
  }

  return queryParams.join("&");
}
