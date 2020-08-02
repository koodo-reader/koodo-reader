import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import DigestModel from "../../model/Digest";
import BookmarkModel from "../../model/Bookmark";

export interface DeleteDialogProps {
  books: BookModel[];
  isOpenDeleteDialog: boolean;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  digests: DigestModel[];
  mode: string;
  shelfIndex: number;
  handleFetchBooks: () => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleFetchBookmarks: () => void;
  handleFetchNotes: () => void;
  handleFetchDigests: () => void;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}
