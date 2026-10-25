import BookModel from "../../../models/Book";
import PluginModel from "../../../models/Plugin";
export interface PopupDictProps {
  isDockedRight: boolean;

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
