import BookModel from "../../model/Book";
import HtmlBookModel from "../../model/HtmlBook";
export interface BackgroundProps {
  currentBook: BookModel;
  locations: any;
  currentChapter: string;
  currentChapterIndex: number;
  htmlBook: HtmlBookModel;
  isShowBookmark: boolean;
  handleCurrentChapter: (currentChapter: string) => void;
  handleCurrentChapterIndex: (currentChapterIndex: number) => void;
}
export interface BackgroundState {
  isSingle: boolean;
  isHideFooter: boolean;
  isHideHeader: boolean;
  prevPage: number;
  nextPage: number;
  scale: string;
}
