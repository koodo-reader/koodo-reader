import { RouteComponentProps } from "react-router-dom";
import Book from "../../models/Book";
export interface HeaderProps extends RouteComponentProps<any> {

  isSortDisplay: boolean;

  isCollapsed: boolean;


  isAuthed: boolean;
  currentBook: Book;
  defaultSyncOption: string;
  mode: string;
  userInfo: any;

  importBookFunc: (file: any) => Promise<void>;
  handleSortDisplay: (isSortDisplay: boolean) => void;
  handleSetting: (isSettingOpen: boolean) => void;
  handleAbout: (isAboutOpen: boolean) => void;
  handleLocalFileDialog: (isOpenLocalFileDialog: boolean) => void;
  handleImportDialog: (isOpenImportDialog: boolean) => void;
  handleFetchAuthed: () => void;
  handleSearchResults: (results: number[]) => void;
  handleFetchUserInfo: () => Promise<any>;
  handleSettingMode: (settingMode: string) => void;
  handleFetchDefaultSyncOption: () => void;

  handleFetchDataSourceList: () => void;
  handleDrag: (isDrag: boolean) => void;
  handleFetchBooks: () => void;
  t: (title: string) => string;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  handleReadingBook: (book: Book) => void;
  handleCollectionDetailDialog: (isOpen: boolean) => void;
  handleCurrentCollectionKey: (key: string) => void;
  handleCloudSyncFunc: (
    cloudSyncFunc: (userInfo: any) => Promise<false | undefined>
  ) => void;
}

export interface HeaderState {
  isHidePro: boolean;
  isSync: boolean;
  notificationCount: number;
}
