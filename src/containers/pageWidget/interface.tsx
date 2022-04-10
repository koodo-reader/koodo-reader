import BookModel from "../../model/Book";
import HtmlBookModel from "../../model/HtmlBook";
export interface BackgroundProps {
  currentBook: BookModel;
  locations: any;
  currentChapter: string;
  htmlBook: HtmlBookModel;
  time: number;
  isShowBookmark: boolean;
}
export interface BackgroundState {
  isSingle: boolean;
  isHideFooter: boolean;
  isHideHeader: boolean;
  currentChapter: string;
  prevPage: number;
  nextPage: number;
  scale: string;
}
