import axios from "axios";

export const getBingDict = async (text: string) => {
  text = decodeURIComponent(encodeURIComponent(text));
  const res = await axios.get(
    `https://www.bing.com/api/v6/dictionarywords/search?q=${text}&appid=371E7B2AF0F9B84EC491D731DF90A55719C7D209&mkt=zh-cn&pname=bingdict`
  );
  const result = res.data;
  const meaningGroups = result.value[0].meaningGroups;
  if (meaningGroups.length === 0) {
    return {};
  }
  const formats = "发音, 快速释义, 变形".trim().split(/,\s*/);
  const formatGroups = meaningGroups.reduce(
    (acc, cur) => {
      const group =
        acc[
          cur.partsOfSpeech?.[0]?.description || cur.partsOfSpeech?.[0]?.name
        ];
      if (Array.isArray(group)) {
        group.push(cur);
      }
      return acc;
    },
    formats.reduce((acc, cur) => {
      acc[cur] = [];
      return acc;
    }, {})
  );
  let target: any = {
    pronunciations: [],
    explanations: [],
    associations: [],
    sentence: [],
  };
  for (const pronunciation of formatGroups["发音"]) {
    target.pronunciations.push({
      region: pronunciation.partsOfSpeech[0].name,
      symbol: pronunciation.meanings[0].richDefinitions[0].fragments[0].text,
      voice: "",
    });
  }
  for (const explanation of formatGroups["快速释义"]) {
    target.explanations.push({
      trait: explanation.partsOfSpeech[0].name,
      explains: explanation.meanings[0].richDefinitions[0].fragments.map(
        (x) => {
          return x.text;
        }
      ),
    });
  }
  if (formatGroups["变形"][0]) {
    for (const association of formatGroups["变形"][0].meanings[0]
      .richDefinitions[0].fragments) {
      target.associations.push(association.text);
    }
  }
  return target;
};

export function parseDescription(html) {
  const descReg = /<meta name="description" content="([^"]+?)" \/>/;
  return html.match(descReg)[1];
}

export function isPhrase(description) {
  return !!description && description.indexOf("释义") !== -1;
}

export function parsePhrase(description) {
  const contentArr = description.split(/(释义|])，/);
  var arrLength = contentArr.length;
  const info = contentArr[arrLength - 1];

  function parseInfo(infoStr) {
    const partReg = /(.+?\.|网络释义：) (.*?)； /g;
    let part;
    const info = {};
    while ((part = partReg.exec(infoStr))) {
      for (let i = 1; i < part.length; i++) {
        const key = part[1].replace(/\.|：/g, "");
        info[key] = part[2].split(/; |；/);
      }
    }
    return info;
  }

  const phrase = parseInfo(info);

  function merge(phrase) {
    var values: any = [];
    for (let key in phrase) {
      phrase[key].map((x) => values.push(x));
    }
    phrase.result = unique(values);
    if (phrase.result.length === 0) {
      throw new Error("未找到");
    }
  }

  merge(phrase);
  return phrase;
}

export function unique(arr) {
  var Set = {};
  var newArr: any = [];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (!Set[item]) {
      Set[item] = true;
      newArr.push(item);
    }
  }
  return newArr;
}
