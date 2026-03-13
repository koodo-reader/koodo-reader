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
  handleFetchPlugins: () => void;
  handleSetting: (isShow: boolean) => void;
  handleSettingMode: (settingMode: string) => void;
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
}
