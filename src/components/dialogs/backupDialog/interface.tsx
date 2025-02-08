import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";
import BookmarkModel from "../../../models/Bookmark";
import { RouteComponentProps } from "react-router-dom";

export interface BackupDialogProps extends RouteComponentProps<any> {
  handleBackupDialog: (isBackup: boolean) => void;
  handleTokenDialog: (isOpenTokenDialog: boolean) => void;
  t: (title: string) => string;
  handleLoadingDialog: (isShowLoading: boolean) => void;
  handleTipDialog: (isTipDialog: boolean) => void;
  handleFetchBooks: () => void;
  isOpenTokenDialog: boolean;
  isAuthed: boolean;
  books: BookModel[];
  notes: NoteModel[];
  digests: NoteModel[];
  dataSourceList: string[];
  bookmarks: BookmarkModel[];
}
export interface BackupDialogState {
  isBackup: string;
  currentDrive: string;
  isDeveloperVer: boolean;
  isFinish: boolean;
}
