import BookModel from "../../model/Book";
export interface ReaderProps {
  currentEpub: any;
  currentBook: BookModel;
  isMessage: boolean;
  handleFetchNotes: () => void;
  handleFetchBooks: () => void;
  handleRenderFunc: (renderFunc: () => void) => void;
  handleFetchBookmarks: () => void;
  handleMessageBox: (isShow: boolean) => void;
  handleFetchPercentage: (currentBook: BookModel) => void;
  handleFetchChapters: (currentEpub: any) => void;
}

export interface ReaderState {
  isOpenRightPanel: boolean;
  isOpenTopPanel: boolean;
  isOpenBottomPanel: boolean;
  isOpenLeftPanel: boolean;
  isMessage: boolean;
  isTouch: boolean;
  readerMode: string;
  rendition: any;
  time: number;
  scale: string;
  margin: number;
}
