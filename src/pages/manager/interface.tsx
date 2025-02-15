import BookModel from "../../models/Book";
import NoteModel from "../../models/Note";
import BookmarkModel from "../../models/Bookmark";
import { RouteComponentProps } from "react-router";
export interface ManagerProps extends RouteComponentProps<any> {
  books: BookModel[];
  notes: NoteModel[];
  digests: NoteModel[];
  bookmarks: BookmarkModel[];
  isReading: boolean;
  mode: string;
  shelfTitle: string;
  isOpenEditDialog: boolean;
  isOpenDeleteDialog: boolean;
  isDetailDialog: boolean;
  isOpenAddDialog: boolean;
  isBookSort: boolean;
  isSortDisplay: boolean;
  isShowChat: boolean;
  isBackup: boolean;
  isSettingOpen: boolean;
  isAboutOpen: boolean;
  isShowLoading: boolean;
  isShowNew: boolean;
  isAuthed: boolean;
  isOpenFeedbackDialog: boolean;
  dragItem: string;
  handleFetchBooks: () => void;
  handleFetchPlugins: () => void;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  handleFetchBookSortCode: () => void;
  handleFetchNoteSortCode: () => void;
  handleFetchList: () => void;
  handleEditDialog: (isOpenEditDialog: boolean) => void;
  handleDeleteDialog: (isOpenDeleteDialog: boolean) => void;
  handleAddDialog: (isOpenAddDialog: boolean) => void;
  handleDetailDialog: (isDetailDialog: boolean) => void;
  handleFeedbackDialog: (isShow: boolean) => void;
  handleLoadingDialog: (isShowLoading: boolean) => void;
  handleNewDialog: (isShowNew: boolean) => void;
  handleBackupDialog: (isBackup: boolean) => void;
  handleReadingState: (isReading: boolean) => void;
  handleSetting: (isSettingOpen: boolean) => void;
  t: (title: string) => string;
}

export interface ManagerState {
  totalBooks: number;
  favoriteBooks: number;
  isAuthed: boolean;
  isError: boolean;
  isCopied: boolean;
  isUpdated: boolean;
  isShowChatBox: boolean;
  isDrag: boolean;
  token: string;
}
