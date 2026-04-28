import PluginModel from "../../../models/Plugin";
export interface PopupAssistProps {
  originalText: string;
  quoteText: string;
  plugins: PluginModel[];
  isAuthed: boolean;
  handleQuoteText: (quoteText: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchPlugins: () => void;
  handleSetting: (isShow: boolean) => void;
  handleSettingMode: (settingMode: string) => void;
  t: (title: string) => string;
}
export interface PopupAssistState {
  aiService: string;
  isAddNew: boolean;
  isWaiting: boolean;
  question: string;
  askHistory: any[];
  chatHistory: any[];
  answer: string;
  mode: string;
  inputQuestion: string;
}
