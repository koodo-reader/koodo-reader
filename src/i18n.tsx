import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationEN from "./assets/locales/en.json";
import translationZHCN from "./assets/locales/zh-CN.json";
import translationZHTW from "./assets/locales/zh-TW.json";
import translationZHMO from "./assets/locales/zh-MO.json";
import translationAR from "./assets/locales/ar.json";
import translationTR from "./assets/locales/tr.json";
import translationRO from "./assets/locales/ro.json";
import translationPL from "./assets/locales/pl.json";
import translationCS from "./assets/locales/cs.json";
import translationJA from "./assets/locales/ja.json";
import translationTA from "./assets/locales/ta.json";
import translationUK from "./assets/locales/uk.json";
import translationSL from "./assets/locales/sl.json";
import translationBO from "./assets/locales/bo.json";
import translationID from "./assets/locales/id.json";
import translationHY from "./assets/locales/hy.json";
import translationEL from "./assets/locales/el.json";
import translationHU from "./assets/locales/hu.json";
import translationHI from "./assets/locales/hi.json";
import translationBG from "./assets/locales/bg.json";
import translationIT from "./assets/locales/it.json";
import translationBN from "./assets/locales/bn.json";
import translationTL from "./assets/locales/tl.json";
import translationSV from "./assets/locales/sv.json";
import translationGA from "./assets/locales/ga.json";
import translationNL from "./assets/locales/nl.json";
import translationKO from "./assets/locales/ko.json";
import translationDE from "./assets/locales/de.json";
import translationRU from "./assets/locales/ru.json";
import translationFR from "./assets/locales/fr.json";
import translationES from "./assets/locales/es.json";
import translationFA from "./assets/locales/fa.json";
import translationPTBR from "./assets/locales/pt-BR.json";
import translationTH from "./assets/locales/th.json";
import translationSR from "./assets/locales/sr.json";
import translationAM from "./assets/locales/am.json";
import translationDA from "./assets/locales/da.json";
import translationFI from "./assets/locales/fi.json";
import translationIE from "./assets/locales/ie.json";
import translationPT from "./assets/locales/pt.json";
import translationVI from "./assets/locales/vi.json";
// the translations
const resources = {
  en: {
    translation: translationEN,
  },
  zhCN: {
    translation: translationZHCN,
  },
  zhTW: {
    translation: translationZHTW,
  },
  zhMO: {
    translation: translationZHMO,
  },
  tr: {
    translation: translationTR,
  },
  ar: {
    translation: translationAR,
  },
  ro: {
    translation: translationRO,
  },
  pl: {
    translation: translationPL,
  },
  cs: {
    translation: translationCS,
  },
  ja: {
    translation: translationJA,
  },
  ta: {
    translation: translationTA,
  },
  uk: {
    translation: translationUK,
  },
  sl: {
    translation: translationSL,
  },
  bo: {
    translation: translationBO,
  },
  id: {
    translation: translationID,
  },
  hy: {
    translation: translationHY,
  },
  el: {
    translation: translationEL,
  },
  hu: {
    translation: translationHU,
  },
  hi: {
    translation: translationHI,
  },
  bg: {
    translation: translationBG,
  },
  nl: {
    translation: translationNL,
  },
  it: {
    translation: translationIT,
  },
  bn: {
    translation: translationBN,
  },
  tl: {
    translation: translationTL,
  },
  sv: {
    translation: translationSV,
  },
  ga: {
    translation: translationGA,
  },
  ko: {
    translation: translationKO,
  },
  de: {
    translation: translationDE,
  },
  ru: {
    translation: translationRU,
  },
  es: {
    translation: translationES,
  },
  fr: {
    translation: translationFR,
  },
  fa: {
    translation: translationFA,
  },
  ptBR: {
    translation: translationPTBR,
  },
  th: {
    translation: translationTH,
  },
  sr: {
    translation: translationSR,
  },
  am: {
    translation: translationAM,
  },
  da: {
    translation: translationDA,
  },
  fi: {
    translation: translationFI,
  },
  ie: {
    translation: translationIE,
  },
  pt: {
    translation: translationPT,
  },
  vi: {
    translation: translationVI,
  },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    keySeparator: false, // we do not use keys in form messages.welcome
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
