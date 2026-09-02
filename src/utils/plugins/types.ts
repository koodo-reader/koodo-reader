import type { AxiosInstance } from "axios";

export type BuiltinPluginType = "translation" | "dictionary" | "voice";
export type RendererPluginType = "translation" | "dictionary";
export type PluginConfigValue =
  | string
  | number
  | boolean
  | null
  | PluginConfigValue[]
  | { [key: string]: PluginConfigValue };
export interface PluginConfig {
  accessKeyId?: string;
  accessKeySecret?: string;
  apiKey?: string;
  appId?: string;
  appKey?: string;
  appSecret?: string;
  baseUrl?: string;
  body?: { [key: string]: PluginConfigValue };
  context?: string;
  custom_voice?: string | number;
  cut_punc?: string;
  domain?: string;
  enableInterTrans?: string | boolean;
  endpoint?: string;
  engine?: string;
  ext?: string;
  formatType?: string;
  handleOption?: string | number;
  host?: string;
  keyType?: string;
  language?: string;
  language_id?: string;
  location?: string;
  memoryLibraryId?: string;
  model?: string;
  modelId?: string;
  params_infer_code?: { [key: string]: PluginConfigValue };
  params_refine_text?: { [key: string]: PluginConfigValue };
  pitch?: string | number;
  port?: string;
  prompt?: string;
  prompt_language?: string;
  prompt_text?: string;
  refer_wav_path?: string;
  region?: string;
  regionId?: string;
  rejectFallback?: string | boolean;
  resourceId?: string;
  secretAccessKey?: string;
  secretId?: string;
  secretKey?: string;
  sessionToken?: string;
  skip_refine?: string | number | boolean;
  speaker_id?: string | number;
  streamType?: string;
  strict?: string | boolean;
  style_wav?: string;
  temperature?: string | number;
  termLibraryId?: string;
  text_language?: string;
  token?: string;
  top_k?: string | number;
  top_p?: string | number;
  url?: string;
  vocabId?: string;
  voice?: string | number;
  voiceFormat?: string;
  voiceId?: string;
  voiceName?: string;
  volume?: string | number;
  [key: string]: PluginConfigValue | undefined;
}
export type PluginLanguageList = Record<string, string> | PluginLanguage[];

export interface PluginLanguage {
  lang: string;
  nativeLang: string;
  code: string;
}

export interface PluginVoice {
  name: string;
  displayName: string;
  plugin: string;
  config: PluginConfig;
  gender?: string;
  locale?: string;
  language?: string;
  [key: string]: unknown;
}

export interface BuiltinPluginDefinition {
  key: string;
  type: BuiltinPluginType;
  displayName: string;
  icon: string;
  version: string;
  autoValue: string;
  defaultConfig: PluginConfig;
  langList: PluginLanguageList;
  voiceList: PluginVoice[];
  name: { en: string; zhCN: string };
  feature: { en: string; zhCN: string };
  configuration: { en: string; zhCN: string };
  websiteName: string;
  websiteUrl: string;
}

export interface BuiltinPluginMarketItem {
  name: string;
  feature: string;
  configuration: string;
  websiteName: string;
  websiteUrl: string;
  plugin: {
    identifier: string;
    type: BuiltinPluginType;
    displayName: string;
    icon: string;
    version: string;
    autoValue: string;
    config: PluginConfig;
    langList: PluginLanguageList;
    voiceList: PluginVoice[];
  };
}

export interface BuiltinPluginRecord {
  key: string;
  type: BuiltinPluginType;
  displayName: string;
  icon: string;
  version: string;
  config: PluginConfig;
  autoValue: string;
  langList: PluginLanguageList;
  voiceList: PluginVoice[];
  scriptSHA256: string;
  script: string;
}

export interface CustomRendererPluginRecord {
  key: string;
  type: RendererPluginType;
  displayName: string;
  icon: string;
  version: string;
  autoValue: string;
  config: PluginConfig;
  langList: PluginLanguageList;
  voiceList: never[];
  scriptSHA256: string;
  script: string;
}

export type TranslatePlugin = (
  text: string,
  from: string,
  to: string,
  axios: AxiosInstance,
  config: PluginConfig
) => Promise<string>;

export type TranslateText = (key: string) => string;

export type DictionaryPlugin = (
  text: string,
  from: string,
  to: string,
  axios: AxiosInstance,
  t: TranslateText,
  config: PluginConfig
) => Promise<string>;

export interface VoicePlugin {
  getAudioPath: (
    text: string,
    speed: number,
    dirPath: string,
    config: PluginConfig
  ) => Promise<string> | string;
  getTTSVoice?: (config: PluginConfig) => Promise<PluginVoice[]>;
}
