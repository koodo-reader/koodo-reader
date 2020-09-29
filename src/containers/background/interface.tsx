import BookModel from "../../model/Book";
export interface BackgroundProps {
  currentEpub: any;
  currentBook: BookModel;
  flattenChapters: any;
  locations: any;
  time: number;
}
export interface BackgroundState {
  isSingle: boolean;
  isShowFooter: boolean;
  currentChapter: string;
  prevPage: number;
  nextPage: number;
  scale: string;
}
