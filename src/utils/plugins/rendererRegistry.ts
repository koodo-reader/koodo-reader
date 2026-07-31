import type { DictionaryPlugin, TranslatePlugin } from "./types";
import { translate as translate0 } from "./renderer/translation/potTranslate";
import { translate as translate1 } from "./renderer/translation/libreTranslate";
import { translate as translate2 } from "./renderer/translation/ollamaTranslate";
import { translate as translate3 } from "./renderer/translation/googleEmbedTranslate";
import { translate as translate4 } from "./renderer/translation/bingEmbedTranslate";
import { translate as translate5 } from "./renderer/translation/baiduEmbedTranslate";
import { translate as translate6 } from "./renderer/translation/deeplTranslate";
import { translate as translate7 } from "./renderer/translation/azureTranslate";
import { translate as translate8 } from "./renderer/translation/amazonTranslate";
import { translate as translate9 } from "./renderer/translation/volcengineTranslate";
import { translate as translate10 } from "./renderer/translation/caiyunTranslate";
import { translate as translate11 } from "./renderer/translation/googleTranslate";
import { translate as translate12 } from "./renderer/translation/niutransTranslate";
import { translate as translate13 } from "./renderer/translation/tencentTranslate";
import { translate as translate14 } from "./renderer/translation/youdaoGeneralTranslate";
import { translate as translate15 } from "./renderer/translation/youdaoLlmTranslate";
import { translate as translate16 } from "./renderer/translation/aliyunTranslate";
import { translate as translate17 } from "./renderer/translation/baiduGeneralTranslate";
import { translate as translate18 } from "./renderer/translation/baiduLlmTranslate";
import { translate as translate19 } from "./renderer/translation/yandexEmbedTranslate";
import { translate as translate20 } from "./renderer/translation/reversoEmbedTranslate";
import { translate as translate21 } from "./renderer/translation/sogouEmbedTranslate";
import { translate as translate22 } from "./renderer/translation/360EmbedTranslate";
import { translate as translate23 } from "./renderer/translation/transmartEmbedTranslate";
import { getDictText as getDictText0 } from "./renderer/dictionary/wikipediaDict";
import { getDictText as getDictText1 } from "./renderer/dictionary/dictionaryapiDict";
import { getDictText as getDictText2 } from "./renderer/dictionary/wiktionaryDict";
import { getDictText as getDictText3 } from "./renderer/dictionary/cambridgeEmbedDict";
import { getDictText as getDictText4 } from "./renderer/dictionary/youdaoEmbedDict";
import { getDictText as getDictText5 } from "./renderer/dictionary/bingEmbedDict";
import { getDictText as getDictText6 } from "./renderer/dictionary/eudicEmbedDict";
import { getDictText as getDictText7 } from "./renderer/dictionary/esdictEmbedDict";
import { getDictText as getDictText8 } from "./renderer/dictionary/frdicEmbedDict";
import { getDictText as getDictText9 } from "./renderer/dictionary/godicEmbedDict";
import { getDictText as getDictText10 } from "./renderer/dictionary/merriamWebsterEmbedDict";
import { getDictText as getDictText11 } from "./renderer/dictionary/baiduEmbedDict";
import { getDictText as getDictText12 } from "./renderer/dictionary/googleEmbedDict";
import { getDictText as getDictText13 } from "./renderer/dictionary/jishoEmbedDict";
import { getDictText as getDictText14 } from "./renderer/dictionary/collinsEmbedDict";
import { getDictText as getDictText15 } from "./renderer/dictionary/cuteslatorEmbedDict";
import { getDictText as getDictText16 } from "./renderer/dictionary/hanyuguoxueEmbedDict";
import { getDictText as getDictText17 } from "./renderer/dictionary/zdicEmbedDict";
import { getDictText as getDictText18 } from "./renderer/dictionary/cedictEmbedDict";
import { getDictText as getDictText19 } from "./renderer/dictionary/weblioEmbedDict";
import { getDictText as getDictText20 } from "./renderer/dictionary/openrussianEmbedDict";

const translations: Partial<Record<string, TranslatePlugin>> = {
  "pot-translate-plugin": translate0,
  "libre-translate-plugin": translate1,
  "ollama-translate-plugin": translate2,
  "google-embed-translate-plugin": translate3,
  "bing-embed-translate-plugin": translate4,
  "baidu-embed-translate-plugin": translate5,
  "deepl-translate-plugin": translate6,
  "azure-translate-plugin": translate7,
  "amazon-translate-plugin": translate8,
  "volcengine-translate-plugin": translate9,
  "caiyun-translate-plugin": translate10,
  "google-translate-plugin": translate11,
  "niutrans-translate-plugin": translate12,
  "tencent-translate-plugin": translate13,
  "youdao-general-translate-plugin": translate14,
  "youdao-llm-translate-plugin": translate15,
  "aliyun-translate-plugin": translate16,
  "baidu-general-translate-plugin": translate17,
  "baidu-llm-translate-plugin": translate18,
  "yandex-embed-translate-plugin": translate19,
  "reverso-embed-translate-plugin": translate20,
  "sogou-embed-translate-plugin": translate21,
  "360-embed-translate-plugin": translate22,
  "transmart-embed-translate-plugin": translate23,
};

const dictionaries: Partial<Record<string, DictionaryPlugin>> = {
  "wikipedia-dict-plugin": getDictText0,
  "dictionaryapi-dict-plugin": getDictText1,
  "wiktionary-dict-plugin": getDictText2,
  "cambridge-embed-dict-plugin": getDictText3,
  "youdao-embed-dict-plugin": getDictText4,
  "bing-embed-dict-plugin": getDictText5,
  "eudic-embed-dict-plugin": getDictText6,
  "esdict-embed-dict-plugin": getDictText7,
  "frdic-embed-dict-plugin": getDictText8,
  "godic-embed-dict-plugin": getDictText9,
  "merriam-webster-embed-dict-plugin": getDictText10,
  "baidu-embed-dict-plugin": getDictText11,
  "google-embed-dict-plugin": getDictText12,
  "jisho-embed-dict-plugin": getDictText13,
  "collins-embed-dict-plugin": getDictText14,
  "cuteslator-embed-dict-plugin": getDictText15,
  "hanyuguoxue-embed-dict-plugin": getDictText16,
  "zdic-embed-dict-plugin": getDictText17,
  "cedict-embed-dict-plugin": getDictText18,
  "weblio-embed-dict-plugin": getDictText19,
  "openrussian-embed-dict-plugin": getDictText20,
};

export const getBuiltinTranslation = (key: string) =>
  Object.prototype.hasOwnProperty.call(translations, key)
    ? translations[key]
    : undefined;

export const getBuiltinDictionary = (key: string) =>
  Object.prototype.hasOwnProperty.call(dictionaries, key)
    ? dictionaries[key]
    : undefined;
