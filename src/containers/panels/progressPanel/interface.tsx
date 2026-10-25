import Book from "../../../models/Book";
import BookModel from "../../../models/Book";
import HtmlBookModel from "../../../models/HtmlBook";

export interface ProgressPanelProps {




}
export interface ProgressPanelState {
  currentPage: number;
  totalPage: number;
  targetChapterIndex: number | string;
  targetPage: number | string;
  isEntered: boolean;
  currentPercentage: number;
}
