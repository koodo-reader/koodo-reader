import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";
import BookmarkModel from "../../../models/Bookmark";

export interface BackupDialogProps {
  handleBackupDialog: (isBackup: boolean) => void;
  handleTokenDialog: (isOpenTokenDialog: boolean) => void;
  t: (title: string) => string;
  handleLoadingDialog: (isShowLoading: boolean) => void;
  handleTipDialog: (isTipDialog: boolean) => void;
  handleFetchBooks: () => void;
  isOpenTokenDialog: boolean;
  books: BookModel[];
  notes: NoteModel[];
  digests: NoteModel[];
  bookmarks: BookmarkModel[];
}
export interface BackupDialogState {
  currentStep: number | null;
  isBackup: string;
  currentDrive: string;
  isDeveloperVer: boolean;
}
