import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";
import BookmarkModel from "../../../models/Bookmark";
import { RouteComponentProps } from "react-router";

export interface DeleteDialogProps extends RouteComponentProps<any> {
  books: BookModel[];
  deletedBooks: BookModel[];
  isOpenDeleteDialog: boolean;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  mode: string;
  shelfTitle: string;
  selectedBooks: string[];
  isSelectBook: boolean;
  handleFetchBooks: () => void;
  handleSelectBook: (isSelectBook: boolean) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;
  handleFetchBookmarks: () => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
  handleFetchNotes: () => void;
  t: (title: string) => string;
}
export interface DeleteDialogState {
  isDeleteShelfBook: boolean;
  isDisableTrashBin: boolean;
}
