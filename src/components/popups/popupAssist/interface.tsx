import PluginModel from "../../../models/Plugin";
import BookModel from "../../../models/Book";
export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};
export interface PopupAssistProps {
  isDockedRight: boolean;

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
