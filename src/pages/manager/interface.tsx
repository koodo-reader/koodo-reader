import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import BookmarkModel from "../../model/Bookmark";
export interface ManagerProps {
  books: BookModel[];
  covers: { key: string; url: string }[];
  notes: NoteModel[];
  digests: NoteModel[];
  bookmarks: BookmarkModel[];
  isReading: boolean;
  mode: string;
  shelfIndex: number;
  isOpenEditDialog: boolean;
  isOpenDeleteDialog: boolean;
  isOpenAddDialog: boolean;
  isSort: boolean;
  isFirst: string;
  isSortDisplay: boolean;
  isMessage: boolean;
  isBackup: boolean;
  handleFetchBooks: () => void;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  handleFetchSortCode: () => void;
  handleFetchList: () => void;
  handleMessageBox: (isShow: boolean) => void;
  handleFirst: (isFirst: string) => void;
}

export interface ManagerState {
  totalBooks: number;
  recentBooks: number;
  isAuthed: boolean;
  isError: boolean;
  isCopied: boolean;
  token: string;
}
