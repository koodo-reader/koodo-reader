import BookmarkModel from "../../../models/Bookmark";
import BookModel from "../../../models/Book";
import HtmlBookModel from "../../../models/HtmlBook";
import NoteModel from "../../../models/Note";
export interface NavListProps {
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  htmlBook: HtmlBookModel;
  digests: NoteModel[];
  currentTab: string;
  t: (title: string) => string;
  handleShowBookmark: (isShowBookmark: boolean) => void;
}
export interface NavListState {
  deleteIndex: number;
}
