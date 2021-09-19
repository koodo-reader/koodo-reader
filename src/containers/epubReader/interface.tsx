import BookModel from "../../model/Book";
export interface ReaderProps {
  currentEpub: any;
  currentBook: BookModel;
  handleFetchNotes: () => void;
  handleFetchBooks: () => void;
  handleRenderFunc: (renderFunc: () => void) => void;
  handleFetchBookmarks: () => void;
  handleFetchPercentage: (currentBook: BookModel) => void;
  handleFetchChapters: (currentEpub: any) => void;
  t: (title: string) => string;
}

export interface ReaderState {
  isOpenRightPanel: boolean;
  isOpenTopPanel: boolean;
  isOpenBottomPanel: boolean;
  isOpenLeftPanel: boolean;
  isTouch: boolean;
  isPreventTrigger: boolean;
  readerMode: string;
  hoverPanel: string;
  rendition: any;
  time: number;
  scale: string;
  margin: number;
}
