import BookModel from "../../../model/Book";
import HtmlBookModel from "../../../model/HtmlBook";

export interface ProgressPanelProps {
  currentEpub: any;
  currentBook: BookModel;
  isReading: boolean;
  t: (title: string) => string;
  percentage: number;
  handleFetchPercentage: (currentBook: BookModel) => void;
  htmlBook: HtmlBookModel;
}
export interface ProgressPanelState {
  displayPercentage: number;
  currentChapter: string;
  currentChapterIndex: number;
  chapters: { top: number; label: string }[];
}
