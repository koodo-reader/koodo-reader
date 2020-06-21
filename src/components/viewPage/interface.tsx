import BookModel from "../../model/Book";
export interface ViewPageProps {
  currentBook: BookModel;
  currentEpub: any;
  locations: any;
  handlePercentage: (percentage: number) => void;
}

export interface ViewPageState {
  isSingle: boolean;
}
