import type { DictionaryPlugin } from "../../types";

export const getDictText: DictionaryPlugin = async (text, from, to, axios, t, config) => {
  let res = await axios
    .get(`https://api.dictionaryapi.dev/api/v2/entries/en/${text}`);

  let dictText =
    `<p class="dict-word-type">[${t(
      "Pronunciations"
    )}]</p></p>` +
    (res.data[0].phonetic ? res.data[0].phonetic : "") +
    `<br/>` +
    res.data[0].phonetics
      .filter((item) => item.audio)
      .map((item) => {
        return (
          `<span class="audio-label">${item.audio.includes("uk") ? "UK" : "US"
          } </span>` +
          `<span class="audio-note">${item.text ? item.text : ""
          } </span>` +
          `<div class="audio-container"><audio controls class="audio-player" controlsList="nodownload noplaybackrate"><source src="${item.audio}" type="audio/mpeg"></audio></div>`
        );
      })
      .join("") +
    res.data[0].meanings
      .map((item) => {
        return `<p><p class="dict-word-type">[${item.partOfSpeech
          }]</p><div>${item.definitions
            .map((item, index) => {
              return (
                `<span style="font-weight: bold">${index + 1}</span>` +
                ". " +
                item.definition
              );
            })
            .join("</div><div>")}</div></p>`;
      })
      .join("") +
    `<p class="dict-learn-more">${t("Learn more")}</p>`;
  window.learnMoreUrl = res.data[0].sourceUrls[0];
  return dictText;

};
