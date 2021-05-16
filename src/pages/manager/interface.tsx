import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import BookmarkModel from "../../model/Bookmark";
import { RouteComponentProps } from "react-router";
export interface ManagerProps extends RouteComponentProps<any> {
  books: BookModel[];
  notes: NoteModel[];
  digests: NoteModel[];
  bookmarks: BookmarkModel[];
  isReading: boolean;
  mode: string;
  shelfIndex: number;
  isOpenEditDialog: boolean;
  isOpenDeleteDialog: boolean;
  isTipDialog: boolean;
  isOpenAddDialog: boolean;
  isBookSort: boolean;
  isSortDisplay: boolean;
  isMessage: boolean;
  isBackup: boolean;
  isSettingOpen: boolean;
  isAboutOpen: boolean;
  isShowLoading: boolean;
  isShowNew: boolean;
  dragItem: string;
  handleFetchBooks: () => void;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  handleFetchBookSortCode: () => void;
  handleFetchList: () => void;
  handleMessageBox: (isShow: boolean) => void;
  handleEditDialog: (isOpenEditDialog: boolean) => void;
  handleDeleteDialog: (isOpenDeleteDialog: boolean) => void;
  handleAddDialog: (isOpenAddDialog: boolean) => void;
  handleTipDialog: (isTipDialog: boolean) => void;
  handleLoadingDialog: (isShowLoading: boolean) => void;
  handleNewDialog: (isShowNew: boolean) => void;
  handleBackupDialog: (isBackup: boolean) => void;
  handleSetting: (isSettingOpen: boolean) => void;
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
