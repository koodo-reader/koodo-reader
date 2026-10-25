import Plugin from "../../../models/Plugin";
import BookModel from "../../../models/Book";

export interface PopupTransProps {
  isDockedRight: boolean;

}
export interface PopupTransState {
  translatedText: string;
  transService: string;
  isAddNew: boolean;
  isFinishOutput: boolean;
  isAiWaiting: boolean;
  originalText: string;
}
