import BookModel from "../../model/Book";

export interface HeaderProps {
  books: BookModel[];
  isSearch: boolean;
  isSortDisplay: boolean;
  handleSortDisplay: (isSortDisplay: boolean) => void;
  handleSetting: (isSettingOpen: boolean) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleBackupDialog: (isBackup: boolean) => void;
  handleDrag: (isDrag: boolean) => void;
}

export interface HeaderState {
  isOnlyLocal: boolean;
  isBookImported: boolean;
  language: string;
  isNewVersion: boolean;
}
