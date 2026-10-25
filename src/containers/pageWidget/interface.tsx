import BookModel from "../../models/Book";
import HtmlBookModel from "../../models/HtmlBook";
export interface PageWidgetProps {




}
export interface PageWidgetState {
  isSingle: boolean;
  prevPage: number;
  nextPage: number;
  currentTime: string;
  percentage: string;
  ignoreNextPageChange: boolean;
}
