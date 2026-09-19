import type { DictionaryPlugin, TranslatePlugin } from "./types";
import { translate as potTranslate } from "./renderer/translation/potTranslate";
import { translate as libreTranslate } from "./renderer/translation/libreTranslate";
import { translate as ollamaTranslate } from "./renderer/translation/ollamaTranslate";
import { translate as googleEmbedTranslate } from "./renderer/translation/googleEmbedTranslate";
import { translate as bingEmbedTranslate } from "./renderer/translation/bingEmbedTranslate";
import { translate as baiduEmbedTranslate } from "./renderer/translation/baiduEmbedTranslate";
import { translate as deeplTranslate } from "./renderer/translation/deeplTranslate";
import { translate as azureTranslate } from "./renderer/translation/azureTranslate";
import { translate as amazonTranslate } from "./renderer/translation/amazonTranslate";
import { translate as volcengineTranslate } from "./renderer/translation/volcengineTranslate";
import { translate as caiyunTranslate } from "./renderer/translation/caiyunTranslate";
import { translate as googleTranslate } from "./renderer/translation/googleTranslate";
import { translate as niutransTranslate } from "./renderer/translation/niutransTranslate";
import { translate as tencentTranslate } from "./renderer/translation/tencentTranslate";
import { translate as youdaoGeneralTranslate } from "./renderer/translation/youdaoGeneralTranslate";
import { translate as youdaoLlmTranslate } from "./renderer/translation/youdaoLlmTranslate";
import { translate as aliyunTranslate } from "./renderer/translation/aliyunTranslate";
import { translate as baiduGeneralTranslate } from "./renderer/translation/baiduGeneralTranslate";
import { translate as baiduLlmTranslate } from "./renderer/translation/baiduLlmTranslate";
import { translate as yandexEmbedTranslate } from "./renderer/translation/yandexEmbedTranslate";
import { translate as reversoEmbedTranslate } from "./renderer/translation/reversoEmbedTranslate";
import { translate as sogouEmbedTranslate } from "./renderer/translation/sogouEmbedTranslate";
import { translate as qihoo360EmbedTranslate } from "./renderer/translation/360EmbedTranslate";
import { translate as transmartEmbedTranslate } from "./renderer/translation/transmartEmbedTranslate";
import { getDictText as wikipediaDictText } from "./renderer/dictionary/wikipediaDict";
import { getDictText as dictionaryapiDictText } from "./renderer/dictionary/dictionaryapiDict";
import { getDictText as wiktionaryDictText } from "./renderer/dictionary/wiktionaryDict";
import { getDictText as cambridgeEmbedDictText } from "./renderer/dictionary/cambridgeEmbedDict";
import { getDictText as youdaoEmbedDictText } from "./renderer/dictionary/youdaoEmbedDict";
import { getDictText as bingEmbedDictText } from "./renderer/dictionary/bingEmbedDict";
import { getDictText as eudicEmbedDictText } from "./renderer/dictionary/eudicEmbedDict";
import { getDictText as esdictEmbedDictText } from "./renderer/dictionary/esdictEmbedDict";
import { getDictText as frdicEmbedDictText } from "./renderer/dictionary/frdicEmbedDict";
import { getDictText as godicEmbedDictText } from "./renderer/dictionary/godicEmbedDict";
import { getDictText as merriamWebsterEmbedDictText } from "./renderer/dictionary/merriamWebsterEmbedDict";
import { getDictText as baiduEmbedDictText } from "./renderer/dictionary/baiduEmbedDict";
import { getDictText as googleEmbedDictText } from "./renderer/dictionary/googleEmbedDict";
import { getDictText as jishoEmbedDictText } from "./renderer/dictionary/jishoEmbedDict";
import { getDictText as collinsEmbedDictText } from "./renderer/dictionary/collinsEmbedDict";
import { getDictText as cuteslatorEmbedDictText } from "./renderer/dictionary/cuteslatorEmbedDict";
import { getDictText as hanyuguoxueEmbedDictText } from "./renderer/dictionary/hanyuguoxueEmbedDict";
import { getDictText as zdicEmbedDictText } from "./renderer/dictionary/zdicEmbedDict";
import { getDictText as cedictEmbedDictText } from "./renderer/dictionary/cedictEmbedDict";
import { getDictText as weblioEmbedDictText } from "./renderer/dictionary/weblioEmbedDict";
import { getDictText as openrussianEmbedDictText } from "./renderer/dictionary/openrussianEmbedDict";

const translations: Partial<Record<string, TranslatePlugin>> = {
  "pot-translate-plugin": potTranslate,
  "libre-translate-plugin": libreTranslate,
  "ollama-translate-plugin": ollamaTranslate,
  "google-embed-translate-plugin": googleEmbedTranslate,
  "bing-embed-translate-plugin": bingEmbedTranslate,
  "baidu-embed-translate-plugin": baiduEmbedTranslate,
  "deepl-translate-plugin": deeplTranslate,
  "azure-translate-plugin": azureTranslate,
  "amazon-translate-plugin": amazonTranslate,
  "volcengine-translate-plugin": volcengineTranslate,
  "caiyun-translate-plugin": caiyunTranslate,
  "google-translate-plugin": googleTranslate,
  "niutrans-translate-plugin": niutransTranslate,
  "tencent-translate-plugin": tencentTranslate,
  "youdao-general-translate-plugin": youdaoGeneralTranslate,
  "youdao-llm-translate-plugin": youdaoLlmTranslate,
  "aliyun-translate-plugin": aliyunTranslate,
  "baidu-general-translate-plugin": baiduGeneralTranslate,
  "baidu-llm-translate-plugin": baiduLlmTranslate,
  "yandex-embed-translate-plugin": yandexEmbedTranslate,
  "reverso-embed-translate-plugin": reversoEmbedTranslate,
  "sogou-embed-translate-plugin": sogouEmbedTranslate,
  "360-embed-translate-plugin": qihoo360EmbedTranslate,
  "transmart-embed-translate-plugin": transmartEmbedTranslate,
};

const dictionaries: Partial<Record<string, DictionaryPlugin>> = {
  "wikipedia-dict-plugin": wikipediaDictText,
  "dictionaryapi-dict-plugin": dictionaryapiDictText,
  "wiktionary-dict-plugin": wiktionaryDictText,
  "cambridge-embed-dict-plugin": cambridgeEmbedDictText,
  "youdao-embed-dict-plugin": youdaoEmbedDictText,
  "bing-embed-dict-plugin": bingEmbedDictText,
  "eudic-embed-dict-plugin": eudicEmbedDictText,
  "esdict-embed-dict-plugin": esdictEmbedDictText,
  "frdic-embed-dict-plugin": frdicEmbedDictText,
  "godic-embed-dict-plugin": godicEmbedDictText,
  "merriam-webster-embed-dict-plugin": merriamWebsterEmbedDictText,
  "baidu-embed-dict-plugin": baiduEmbedDictText,
  "google-embed-dict-plugin": googleEmbedDictText,
  "jisho-embed-dict-plugin": jishoEmbedDictText,
  "collins-embed-dict-plugin": collinsEmbedDictText,
  "cuteslator-embed-dict-plugin": cuteslatorEmbedDictText,
  "hanyuguoxue-embed-dict-plugin": hanyuguoxueEmbedDictText,
  "zdic-embed-dict-plugin": zdicEmbedDictText,
  "cedict-embed-dict-plugin": cedictEmbedDictText,
  "weblio-embed-dict-plugin": weblioEmbedDictText,
  "openrussian-embed-dict-plugin": openrussianEmbedDictText,
};

export const getBuiltinTranslation = (key: string) =>
  Object.prototype.hasOwnProperty.call(translations, key)
    ? translations[key]
    : undefined;

export const getBuiltinDictionary = (key: string) =>
  Object.prototype.hasOwnProperty.call(dictionaries, key)
    ? dictionaries[key]
    : undefined;
