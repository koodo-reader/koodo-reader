import Plugin from "../../../models/Plugin";
import BookModel from "../../../models/Book";

export interface PopupTransProps {
  originalText: string;
  plugins: Plugin[];
  currentBook: BookModel;
  isAuthed: boolean;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchPlugins: () => void;
  handleSetting: (isShow: boolean) => void;
  handleSettingMode: (settingMode: string) => void;
  t: (title: string) => string;
}
export interface PopupTransState {
  translatedText: string;
  originalText: string;
  transService: string;
  transTarget: string;
  transSource: string;
  isAddNew: boolean;
  isFinishOutput: boolean;
}
