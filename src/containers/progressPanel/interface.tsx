import BookModel from "../../model/Book";

export interface ProgressPanelProps {
  currentEpub: any;
  currentBook: BookModel;
  percentage: number;
  locations: any;
}
export interface ProgressPanelState {
  displayPercentage: number;
}
