import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";
import BookmarkModel from "../../../model/Bookmark";

export interface EditDialogProps {
  t: (title: string) => string;
  handleFetchBooks: () => void;
  handleEditDialog: (isShow: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;
  books: BookModel[];
  notes: NoteModel[];
  digests: NoteModel[];
  bookmarks: BookmarkModel[];
  isOpenDeleteDialog: boolean;
  currentBook: BookModel;
}

export interface EditDialogState {
  isCheck: boolean;
}
