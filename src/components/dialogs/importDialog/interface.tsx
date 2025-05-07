import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";
import BookmarkModel from "../../../models/Bookmark";
import { RouteComponentProps } from "react-router-dom";

export interface ImportDialogProps extends RouteComponentProps<any> {
  handleImportDialog: (isOpenImportDialog: boolean) => void;
  handleTokenDialog: (isOpenTokenDialog: boolean) => void;
  t: (title: string) => string;
  handleLoadingDialog: (isShowLoading: boolean) => void;
  handleFetchBooks: () => void;
  isOpenTokenDialog: boolean;
  isAuthed: boolean;
  books: BookModel[];
  notes: NoteModel[];
  digests: NoteModel[];
  dataSourceList: string[];
  bookmarks: BookmarkModel[];
}
export interface ImportDialogState {
  isBackup: string;
  currentDrive: string;
  isDeveloperVer: boolean;
  isFinish: boolean;
}
