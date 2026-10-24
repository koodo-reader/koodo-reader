import BookModel from "../../../models/Book";
import PluginModel from "../../../models/Plugin";
export interface PopupDictProps {
  originalText: string;
  originalSentence: string;
  plugins: PluginModel[];
  isAuthed: boolean;
  isDockedRight: boolean;
  currentBook: BookModel;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchPlugins: () => void;
  handleSetting: (isShow: boolean) => void;
  handleSettingMode: (settingMode: string) => void;
  t: (title: string) => string;
}
export interface PopupDictState {
  dictText: string;
  word: string;
  prototype: string;
  dictService: string;
  dictTarget: string;

  isAddNew: boolean;

  aiAnswer: string;
  isAiWaiting: boolean;
  isAiStreaming: boolean;
}
