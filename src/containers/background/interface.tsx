import BookModel from "../../model/Book";
export interface BackgroundProps {
  currentEpub: any;
  currentBook: BookModel;
  flattenChapters: any;
  locations: any;
  time: number;
  handleFetchLocations: (currentEpub: any) => void;
}
export interface BackgroundState {
  isSingle: boolean;
  isShowFooter: boolean;
  isUseBackground: boolean;
  currentChapter: string;
  prevPage: number;
  nextPage: number;
  scale: string;
}
