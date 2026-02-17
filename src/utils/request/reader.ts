import toast from "react-hot-toast";
import {
  ConfigService,
  ReaderRequest,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import i18n from "../../i18n";
import { handleExitApp } from "./common";
import { officialDictList } from "../../constants/settingList";
import {
  getServerRegion,
  getWebsiteUrl,
  openExternalUrl,
  vexComfirmAsync,
} from "../common";
let readerRequest: ReaderRequest | undefined;
let isShowingQuotaAlert = false;
let quotaAlertDismissTime = 0;
export const getTransStream = async (
  text: string,
  from: string,
  to: string,
  onMessage: (result) => void
) => {
  let readerRequest = await getReaderRequest();
  let result = await readerRequest.getTransFetch(
    {
      text,
      from,
      to,
    },
    onMessage
  );
  return result;
};
export const getSummaryStream = async (
  text: string,
  to: string,
  onMessage: (result) => void
) => {
  let readerRequest = await getReaderRequest();
  let result = await readerRequest.getSummaryFetch(
    {
      text,
      to,
    },
    onMessage
  );
  return result;
};
export const getAnswerStream = async (
  text: string,
  question: string,
  history: any[],
  mode: string,
  onMessage: (result) => void
) => {
  let readerRequest = await getReaderRequest();
  let result = await readerRequest.getAnswerFetch(
    {
      text,
      question,
      history,
      mode,
    },
    onMessage
  );
  return result;
};
export const getDictionary = async (word: string, from: string, to: string) => {
  let readerRequest = await getReaderRequest();
  let response = await readerRequest.getDictionary({ word, from, to });
  if (response.code === 200) {
    return response;
  } else if (response.code === 401) {
    handleExitApp();
    return;
  } else {
    toast.error(i18n.t("Fetch failed, error code") + ": " + response.msg);
    if (response.code === 20004) {
      toast(
        i18n.t("Please login again to update your membership on this device")
      );
    }
  }
  return response;
};
export const getReaderRequest = async () => {
  if (readerRequest) {
    return readerRequest;
  }
  readerRequest = new ReaderRequest(
    TokenService,
    ConfigService,
    getServerRegion()
  );
  return readerRequest;
};
export const resetReaderRequest = () => {
  readerRequest = undefined;
};
export const getDictText = async (word: string, from: string, to: string) => {
  if (from === "en") {
    from = "eng";
  }
  let res = await getDictionary(word, from, to);
  if (res.code === 200 && res.data && res.data.length > 0) {
    let dictText =
      `<p class="dict-word-type">[${i18n.t("Pronunciations")}]</p>` +
      (res.data[0].pronunciation ? res.data[0].pronunciation : "") +
      (res.data[0].audio &&
        `<div class="audio-container"><audio controls preload="auto"    class="audio-player" controlsList="nodownload noplaybackrate"><source src="${res.data[0].audio}" type="audio/mpeg"></audio></div>`) +
      (res.data[0].form
        ? `<p class="dict-word-type">[${i18n.t("Inflection")}]</p>`
        : "") +
      (res.data[0].form
        ? Array.from(new Set(res.data[0].form)).join(", ")
        : "") +
      res.data[0].meaning
        .map((item) => {
          return (
            (item.type && `<p><p class="dict-word-type">[${item.type}]</p>`) +
            `<div  style="font-weight: bold">${
              item.definition
            }</div><div>${item.examples
              .map((item) => {
                return `<p>${item.sentence}</p>` + `<p>${item.translation}</p>`;
              })
              .join("</div><div>")}</div></p>`
          );
        })
        .join("") +
      (res.data[0].comparison
        ? `<p class="dict-word-type">[${i18n.t("Word comparison")}]</p>`
        : "") +
      (res.data[0].comparison
        ? res.data[0].comparison.map(
            (item) =>
              `<p class="dict-learn-more">${item.word_to_compare}: </p>${item.analysis}`
          )
        : "") +
      `<p class="dict-learn-more">${i18n.t("Generated with AI")}</p>`;
    return dictText;
  } else {
    toast.error(
      i18n.t("No result found") +
        " " +
        i18n.t(
          officialDictList.find((item) => item.code === from)?.nativeLang ||
            from
        ) +
        " -> " +
        i18n.t(
          officialDictList.find((item) => item.code === to)?.nativeLang || to
        )
    );
    if (from === "auto") {
      toast(
        i18n.t(
          "Language auto-detection may not be accurate. Please try selecting the source language manually"
        )
      );
    }
    return "";
  }
};
export const getOcrResult = async (imageBase64: string, lang: string) => {
  let readerRequest = await getReaderRequest();
  let response = await readerRequest.getOcrResult({
    image_base64: imageBase64,
    lang,
  });
  if (response.code === 200) {
    return response;
  } else if (response.code === 401) {
    handleExitApp();
    return;
  } else {
    toast.error(i18n.t("Fetch failed, error code") + ": " + response.msg);
  }
  return response;
};
export const getTTSAudio = async (
  text: string,
  language: string,
  voice: string,
  speed: number,
  pitch: number,
  isFirst: boolean
) => {
  let readerRequest = await getReaderRequest();
  let response = await readerRequest.getTTSAudio({
    text,
    language,
    voice,
    speed,
    pitch,
    is_first: isFirst,
  });
  if (response.code === 200) {
    return response;
  } else if (response.code === 401) {
    handleExitApp();
    return;
  } else if (response.code === 20009) {
    const now = Date.now();
    const timeSinceDismiss = now - quotaAlertDismissTime;

    if (!isShowingQuotaAlert && timeSinceDismiss >= 10000) {
      isShowingQuotaAlert = true;
      let result = await vexComfirmAsync(
        i18n.t(
          "You have exhausted your daily free AI voice character quota. Please purchase more quota to continue using this feature or wait until the quota resets. You can also use other TTS voices instead."
        ),
        "Purchase more quota"
      );
      if (result) {
        isShowingQuotaAlert = false;
        quotaAlertDismissTime = Date.now();
        openExternalUrl(
          getWebsiteUrl() +
            (ConfigService.getReaderConfig("lang").startsWith("zh")
              ? "/zh"
              : "/en") +
            "/tts-quota"
        );
      } else {
        isShowingQuotaAlert = false;
        quotaAlertDismissTime = Date.now();
      }
    }
    return response;
  } else {
    toast.error(i18n.t("Fetch failed, error code") + ": " + response.msg);
  }
  return null;
};
