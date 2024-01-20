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
  const formats = "发音, 快速释义, 变形, 例句".trim().split(/,\s*/);
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
    audios: [],
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
  for (const explanation of formatGroups["例句"]) {
    target.sentence = explanation.meanings[0].richDefinitions.map((item) => {
      let list = item.examples.map((x) => {
        return handleExamples(x);
      });
      return {
        translation: list[0],
        source: list[2],
      };
    });
  }
  if (formatGroups["变形"][0]) {
    for (const association of formatGroups["变形"][0].meanings[0]
      .richDefinitions[0].fragments) {
      target.associations.push(association.text);
    }
  }
  if (result.value[0].pronunciationAudio) {
    target.audios.push({ url: result.value[0].pronunciationAudio.contentUrl });
  }

  return target;
};

export function handleExamples(sentence: string) {
  let regex1 = /\{(\d+)#(.*?)\$.*?\}/g;
  let str = sentence.replace(regex1, "$2");
  let regex2 = /\{##\*|\*\$\$\}|\{#\*|\*\$\}/g;
  return str.replace(regex2, "");
}
