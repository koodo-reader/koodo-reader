import BookModel from "../../model/Book";
export interface ReaderProps {
  currentEpub: any;
  currentBook: BookModel;
  isMessage: boolean;
  handleFetchNotes: () => void;
  handleFetchDigests: () => void;
  handleFetchBookmarks: () => void;
  handleMessageBox: (isShow: boolean) => void;
  handleFetchPercentage: (currentBook: BookModel) => void;
  handleFetchChapters: (currentEpub: any) => void;
}

export interface ReaderState {
  isOpenSettingPanel: boolean;
  isOpenOperationPanel: boolean;
  isOpenProgressPanel: boolean;
  isOpenInfoPanel: boolean;
  isMessage: boolean;
}
