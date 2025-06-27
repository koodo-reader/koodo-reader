import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";
import BookmarkModel from "../../../models/Bookmark";
import { RouteComponentProps } from "react-router-dom";

export interface LocalFileDialogProps extends RouteComponentProps<any> {
  handleLocalFileDialog: (isBackup: boolean) => void;
  handleTokenDialog: (isOpenTokenDialog: boolean) => void;
  t: (title: string) => string;
  handleLoadingDialog: (isShowLoading: boolean) => void;
  handleFetchBooks: () => void;
  isOpenTokenDialog: boolean;
  isAuthed: boolean;
  books: BookModel[];
  notes: NoteModel[];
  dataSourceList: string[];
  bookmarks: BookmarkModel[];
}
export interface LocalFileDialogState {
  isFinish: boolean;
  hasLocalAccess: boolean;
  status: any;
}
