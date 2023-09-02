export const getBingDict = (html) => {
  const description = parseDescription(html);
  if (isPhrase(description)) {
    try {
      return Promise.resolve(parsePhrase(description));
    } catch (e) {
      return Promise.resolve("error");
    }
  } else {
    return Promise.resolve("error");
  }
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
