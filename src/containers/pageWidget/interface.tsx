import BookModel from "../../model/Book";
import HtmlBookModel from "../../model/HtmlBook";
export interface BackgroundProps {
  currentEpub: any;
  currentBook: BookModel;
  flattenChapters: any;
  locations: any;
  currentChapter: string;
  htmlBook: HtmlBookModel;
  time: number;
  handleFetchLocations: (currentEpub: any) => void;
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
