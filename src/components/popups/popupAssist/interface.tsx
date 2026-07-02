import PluginModel from "../../../models/Plugin";
import BookModel from "../../../models/Book";
export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};
export interface PopupAssistProps {
  currentBook: BookModel;
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
  askHistory: AiChatMessage[];
  chatHistory: AiChatMessage[];
  answer: string;
  mode: string;
  inputQuestion: string;
}
