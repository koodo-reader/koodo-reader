import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import BookmarkModel from "../../model/Bookmark";
import { RouteComponentProps } from "react-router";
export interface ImportLocalProps extends RouteComponentProps<any> {
  books: BookModel[];
  deletedBooks: BookModel[];
  dragItem: string;
  notes: NoteModel[];
  isCollapsed: boolean;

  bookmarks: BookmarkModel[];
  handleFetchBooks: () => void;
  handleDrag: (isDrag: boolean) => void;
  handleReadingBook: (book: BookModel) => void;
  t: (title: string) => string;
}
export interface ImportLocalState {
  isOpenFile: boolean;
  isKindleSuccess: boolean;
  isImportPath: boolean;
  tempFile: any;
  width: number;
}
