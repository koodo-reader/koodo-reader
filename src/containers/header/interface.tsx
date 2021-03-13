import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import BookmarkModel from "../../model/Bookmark";
export interface HeaderProps {
  isSearch: boolean;
  isSortDisplay: boolean;
  isCollapsed: boolean;

  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  books: BookModel[];
  handleSortDisplay: (isSortDisplay: boolean) => void;
  handleSetting: (isSettingOpen: boolean) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleBackupDialog: (isBackup: boolean) => void;
  handleDrag: (isDrag: boolean) => void;
}

export interface HeaderState {
  isOnlyLocal: boolean;
  language: string;
  width: number;
  isNewVersion: boolean;
}
