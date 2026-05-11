import BookModel from "../../models/Book";
import PluginModel from "../../models/Plugin";
import HtmlBook from "../../models/HtmlBook";

export interface TextToSpeechProps {
  currentBook: BookModel;
  plugins: PluginModel[];
  htmlBook: HtmlBook;
  isReading: boolean;
  isAuthed: boolean;
  readerMode: string;
  speechStartText: string;
  isSpeechAutoStart: boolean;
  handleFetchPlugins: () => void;
  handleSetting: (isShow: boolean) => void;
  handleSettingMode: (settingMode: string) => void;
  handleSpeechStartText: (speechStartText: string) => void;
  handleSpeechAutoStart: (isSpeechAutoStart: boolean) => void;
  t: (title: string) => string;
}
export interface TextToSpeechState {
  isSupported: boolean;
  isAudioOn: boolean;
  isPaused: boolean;
  currentIndex: number;
  voiceLocale: string;
  languageList: string[];
  voiceList: any;
  multiRoleEnabled: boolean;
  multiRoleVoiceType: string;
  multiRoleNarratorVoice: string;
  multiRoleMaleVoice: string;
  multiRoleFemaleVoice: string;
  multiRoleNarratorEngine: string;
  multiRoleMaleEngine: string;
  multiRoleFemaleEngine: string;
  multiRoleChildVoice: string;
  multiRoleChildEngine: string;
}
