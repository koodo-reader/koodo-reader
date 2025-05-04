import BookModel from "../../models/Book";
import HtmlBookModel from "../../models/HtmlBook";
export interface BackgroundProps {
  currentBook: BookModel;
  locations: any;
  currentChapter: string;
  readerMode: string;
  currentChapterIndex: number;
  isNavLocked: boolean;
  isSettingLocked: boolean;
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
