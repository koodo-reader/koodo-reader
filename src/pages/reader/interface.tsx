import BookModel from "../../model/Book";
export interface ReaderProps {
  currentEpub: any;
  currentBook: BookModel;
  isMessage: boolean;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  handleMessageBox: (isShow: boolean) => void;
  handleFetchPercentage: (currentBook: BookModel) => void;
  handleFetchChapters: (currentEpub: any) => void;
}

export interface ReaderState {
  isOpenSettingPanel: boolean;
  isOpenOperationPanel: boolean;
  isOpenProgressPanel: boolean;
  isOpenNavPanel: boolean;
  isMessage: boolean;
  isTouch: boolean;
  readerMode: string;
  rendition: any;
  time: number;
}
