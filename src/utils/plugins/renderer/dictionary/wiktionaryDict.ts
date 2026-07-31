import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  text = decodeURIComponent(encodeURIComponent(text));
  const res = await axios.get(
    `https://${to}.wiktionary.org/w/api.php?action=query&titles=${text}&prop=extracts&format=json&origin=*`
  );
  const page = res.data.query.pages[Object.keys(res.data.query.pages)[0]];
  window.learnMoreUrl = `https://${to}.wiktionary.org/wiki/${text}`;
  return `<p class="wiki-text">${page.extract}</p><p class="dict-learn-more">${t("Learn more")}</p>`;
}
