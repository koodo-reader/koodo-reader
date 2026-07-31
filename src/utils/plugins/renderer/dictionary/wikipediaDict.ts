import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  text = decodeURIComponent(encodeURIComponent(text));
  const res = await axios.get(
    `https://${to}.wikipedia.org/w/api.php?action=query&titles=${text}&prop=extracts&format=json&origin=*`
  );
  let html = `<p class="wiki-text">${res.data.query.pages[Object.keys(res.data.query.pages)[0]].extract
    }</p><p class="dict-learn-more">${t("Learn more")}</p>`;
  window.learnMoreUrl = "https://" + to + ".wikipedia.org/wiki/" +
    text;
  return html
};
