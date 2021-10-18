import BookModel from "../../../model/Book";

export interface ProgressPanelProps {
  currentEpub: any;
  currentBook: BookModel;
  percentage: number;
  locations: any;
  flattenChapters: any;
  handleFetchPercentage: (currentBook: BookModel) => void;
  t: (title: string) => string;
}
export interface ProgressPanelState {
  displayPercentage: number;
  currentPage: number;
  totalPage: number;
  currentChapterIndex: number;
}
