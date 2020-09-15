import i18n from "i18next";
import { reactI18nextModule } from "react-i18next";
import detector from "i18next-browser-languagedetector";
import translationEN from "./assets/locales/en/translation.json";
import translationCN from "./assets/locales/cn/translation.json";
import translationTW from "./assets/locales/tw/translation.json";

// the translations
const resources = {
  en: {
    translation: translationEN,
  },
  zh: {
    translation: translationCN,
  },
  cht: {
    translation: translationTW,
  },
};

i18n
  .use(detector)
  .use(reactI18nextModule as any) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "zh",
    fallbackLng: "en",
    keySeparator: false, // we do not use keys in form messages.welcome
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
