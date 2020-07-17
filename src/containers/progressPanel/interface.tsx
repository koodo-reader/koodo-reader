import BookModel from "../../model/Book";

export interface ProgressPanelProps {
  currentEpub: any;
  currentBook: BookModel;
  percentage: number;
  locations: any;
  handleFetchLocations: (currentEpub: any) => void;
}
export interface ProgressPanelState {
  displayPercentage: number;
}
