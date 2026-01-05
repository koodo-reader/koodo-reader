import BookModel from "../../models/Book";
import { RouteComponentProps } from "react-router";
export interface ManagerProps extends RouteComponentProps<any> {
  books: BookModel[];
  mode: string;
  shelfTitle: string;
  isOpenEditDialog: boolean;
  isOpenDeleteDialog: boolean;
  isDetailDialog: boolean;
  isOpenAddDialog: boolean;
  isOpenImportDialog: boolean;
  isSortDisplay: boolean;
  isBackup: boolean;
  isSettingOpen: boolean;
  isShowPopupNote: boolean;
  isAboutOpen: boolean;
  isShowLoading: boolean;
  isShowNew: boolean;
  isShowSupport: boolean;
  isAuthed: boolean;
  isOpenSortShelfDialog: boolean;
  isOpenLocalFileDialog: boolean;
  dragItem: string;
  handleFetchBooks: () => void;
  handleFetchPlugins: () => void;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  handleFetchBookSortCode: () => void;
  handleFetchNoteSortCode: () => void;
  handleFetchViewMode: () => void;
  handleEditDialog: (isOpenEditDialog: boolean) => void;
  handleDeleteDialog: (isOpenDeleteDialog: boolean) => void;
  handleAddDialog: (isOpenAddDialog: boolean) => void;
  handleDetailDialog: (isDetailDialog: boolean) => void;
  handleLoadingDialog: (isShowLoading: boolean) => void;
  handleNewDialog: (isShowNew: boolean) => void;
  handleShowSupport: (isShowSupport: boolean) => void;
  handleBackupDialog: (isBackup: boolean) => void;
  handleLocalFileDialog: (isOpenLocalFileDialog: boolean) => void;
  handleImportDialog: (isOpenImportDialog: boolean) => void;
  handleReadingState: (isReading: boolean) => void;
  handleSetting: (isSettingOpen: boolean) => void;
  handleShowPopupNote: (isShowPopupNote: boolean) => void;
  handleSortShelfDialog: (isOpenSortShelfDialog: boolean) => void;
  t: (title: string) => string;
}

export interface ManagerState {
  totalBooks: number;
  favoriteBooks: number;
  isAuthed: boolean;
  isError: boolean;
  isCopied: boolean;
  isUpdated: boolean;
  isDrag: boolean;
  token: string;
}
