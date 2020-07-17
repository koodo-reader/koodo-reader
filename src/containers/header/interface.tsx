import BookModel from "../../model/Book";

export interface HeaderProps {
  books: BookModel[];
  isSearch: boolean;
  isSortDisplay: boolean;
  handleSortDisplay: (isSort: boolean) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleBackupDialog: (isBackup: boolean) => void;
}

export interface HeaderState {
  isOnlyLocal: boolean;
  isBookImported: boolean;
  isChinese: boolean;
  isNewVersion: boolean;
}
