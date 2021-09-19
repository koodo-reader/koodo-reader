import BookModel from "../../model/Book";
export interface ReaderProps {
  currentEpub: any;
  currentBook: BookModel;
  percentage: number;
  t: (title: string) => string;
  handleFetchNotes: () => void;
  handleFetchBooks: () => void;
  handleFetchBookmarks: () => void;
  handleFetchPercentage: (currentBook: BookModel) => void;
  handleFetchChapters: (currentEpub: any) => void;
}

export interface ReaderState {
  isOpenRightPanel: boolean;
  isOpenTopPanel: boolean;
  isOpenBottomPanel: boolean;
  isOpenLeftPanel: boolean;
  isTouch: boolean;
  isPreventTrigger: boolean;
  readerMode: string;
  rendition: any;
  time: number;
  scale: string;
  margin: number;
}
