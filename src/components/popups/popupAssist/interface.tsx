import PluginModel from "../../../models/Plugin";
export interface PopupAssistProps {
  originalText: string;
  plugins: PluginModel[];
  isAuthed: boolean;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
  handleFetchPlugins: () => void;
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
