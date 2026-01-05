import Book from "../../../models/Book";
import BookModel from "../../../models/Book";
import HtmlBookModel from "../../../models/HtmlBook";

export interface ProgressPanelProps {
  currentBook: BookModel;
  currentChapter: string;
  readerMode: string;
  currentChapterIndex: number;
  t: (title: string) => string;
  percentage: number;
  htmlBook: HtmlBookModel;
  renderBookFunc: (id: string) => void;
  handleFetchPercentage: (book: Book) => void;
  handleCurrentChapter: (currentChapter: string) => void;
}
export interface ProgressPanelState {
  currentPage: number;
  totalPage: number;
  targetChapterIndex: number | string;
  targetPage: number | string;
  isEntered: boolean;
  currentPercentage: number;
}
