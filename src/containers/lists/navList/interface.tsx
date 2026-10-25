import BookmarkModel from "../../../models/Bookmark";
import BookModel from "../../../models/Book";
import HtmlBookModel from "../../../models/HtmlBook";
import NoteModel from "../../../models/Note";
export interface NavListProps {
  currentTab: string;
}
export interface NavListState {
  deleteIndex: number;
  currentData: (BookmarkModel | NoteModel)[];
  isSearchOpen: boolean;
  searchKeyword: string;
  searchResults: (BookmarkModel | NoteModel)[];
  isComposing: boolean;
  isSortOpen: boolean;
  sortCode: number;
  orderCode: number;
}
