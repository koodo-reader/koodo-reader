import BookModel from "../../models/Book";
import NoteModel from "../../models/Note";
import BookmarkModel from "../../models/Bookmark";
import { RouteComponentProps } from "react-router-dom";
export interface HeaderProps extends RouteComponentProps<any> {
  isSearch: boolean;
  isSortDisplay: boolean;
  isAboutOpen: boolean;
  isCollapsed: boolean;
  isNewWarning: boolean;
  isAuthed: boolean;
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  books: BookModel[];
  defaultSyncOption: string;
  handleSortDisplay: (isSortDisplay: boolean) => void;
  handleSetting: (isSettingOpen: boolean) => void;
  handleAbout: (isAboutOpen: boolean) => void;
  handleBackupDialog: (isBackup: boolean) => void;
  handleFeedbackDialog: (isShow: boolean) => void;
  handleFetchAuthed: () => void;
  handleFetchDefaultSyncOption: () => void;
  handleFetchLoginOptionList: () => void;
  handleFetchDataSourceList: () => void;
  handleDrag: (isDrag: boolean) => void;
  handleFetchBooks: () => void;
  t: (title: string) => string;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
}

export interface HeaderState {
  isOnlyLocal: boolean;
  language: string;
  width: number;
  isNewVersion: boolean;
  isDataChange: boolean;
  isDeveloperVer: boolean;
  isHidePro: boolean;
  isSync: boolean;
}
