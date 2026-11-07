import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationEN from "./assets/locales/en.json";

const localeModules = import.meta.glob("./assets/locales/*.json");

const languageFileMap: Record<string, string> = {
  zhCN: "zh-CN",
  zhTW: "zh-TW",
  zhMO: "zh-MO",
  ptBR: "pt-BR",
};

const getLocalePath = (lng: string) =>
  `./assets/locales/${languageFileMap[lng] || lng}.json`;

export const loadLanguage = async (lng: string) => {
  if (i18n.hasResourceBundle(lng, "translation")) {
    return;
  }
  const loader = localeModules[getLocalePath(lng)];
  if (!loader) {
    return;
  }
  const module = (await loader()) as {
    default: Record<string, string>;
  };
  i18n.addResourceBundle(lng, "translation", module.default, true, true);
};

export const changeLanguage = async (lng: string) => {
  await loadLanguage(lng);
  return i18n.changeLanguage(lng);
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: translationEN,
      },
    },
    lng: "en",
    fallbackLng: "en",
    keySeparator: false, // we do not use keys in form messages.welcome
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
