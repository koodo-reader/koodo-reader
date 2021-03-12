import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";
import BookmarkModel from "../../../model/Bookmark";

export interface BackupDialogProps {
  handleBackupDialog: (isBackup: boolean) => void;
  handleTokenDialog: (isOpenTokenDialog: boolean) => void;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
  handleLoadingDialog: (isShowLoading: boolean) => void;
  handleDownloadDesk: (isDownloadDesk: boolean) => void;
  isOpenTokenDialog: boolean;
  books: BookModel[];
  notes: NoteModel[];
  digests: NoteModel[];
  bookmarks: BookmarkModel[];
}
export interface BackupDialogState {
  currentStep: number | null;
  isBackup: string;
  currentDrive: number | null;
}
