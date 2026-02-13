import { RouteComponentProps } from "react-router-dom";
export interface HeaderProps extends RouteComponentProps<any> {
  isSearch: boolean;
  isSortDisplay: boolean;
  isAboutOpen: boolean;
  isCollapsed: boolean;
  isNewWarning: boolean;
  isLoadMore: boolean;
  isAuthed: boolean;

  defaultSyncOption: string;
  mode: string;
  userInfo: any;
  bookSortCode: { sort: number; order: number };
  handleSortDisplay: (isSortDisplay: boolean) => void;
  handleSetting: (isSettingOpen: boolean) => void;
  handleAbout: (isAboutOpen: boolean) => void;
  handleBackupDialog: (isBackup: boolean) => void;
  handleLocalFileDialog: (isOpenLocalFileDialog: boolean) => void;
  handleImportDialog: (isOpenImportDialog: boolean) => void;
  handleFetchAuthed: () => void;
  handleSearchResults: (results: number[]) => void;
  handleFetchUserInfo: () => Promise<void>;
  handleSettingMode: (settingMode: string) => void;
  handleFetchDefaultSyncOption: () => void;
  handleFetchLoginOptionList: () => void;
  handleFetchDataSourceList: () => void;
  handleDrag: (isDrag: boolean) => void;
  handleFetchBooks: () => void;
  t: (title: string) => string;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  handleCloudSyncFunc: (
    cloudSyncFunc: () => Promise<false | undefined>
  ) => void;
}

export interface HeaderState {
  isOnlyLocal: boolean;
  language: string;
  width: number;
  isNewVersion: boolean;
  isDataChange: boolean;
  isHidePro: boolean;
  isSync: boolean;
}
