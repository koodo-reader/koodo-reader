import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import BookmarkModel from "../../model/Bookmark";
import { RouteComponentProps } from "react-router";

export interface DeleteDialogProps extends RouteComponentProps<any> {
  books: BookModel[];
  isOpenDeleteDialog: boolean;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  digests: NoteModel[];
  mode: string;
  shelfIndex: number;
  handleFetchBooks: () => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;
  handleFetchBookmarks: () => void;
  handleFetchNotes: () => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}
