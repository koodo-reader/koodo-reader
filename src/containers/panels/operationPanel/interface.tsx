import BookModel from "../../../models/Book";
import HtmlBookModel from "../../../models/HtmlBook";

export interface OperationPanelProps {

  rendition: any;
  currentDuration: number;




}

export interface OperationPanelState {
  timeLeft: number;
  isFullscreen: boolean;
}
