import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";
import BookmarkModel from "../../../models/Bookmark";
import { RouteComponentProps } from "react-router";
export interface BookListProps extends RouteComponentProps<any> {
  books: BookModel[];
  mode: string;
  shelfTitle: string;
  searchResults: number[];
  isSearch: boolean;
  isCollapsed: boolean;
  currentPage: number;
  totalPage: number;
  isBookSort: boolean;
  isSelectBook: boolean;
  viewMode: string;
  selectedBooks: string[];
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  bookSortCode: { sort: number; order: number };
  noteSortCode: { sort: number; order: number };
  handleFetchList: () => void;
  handleAddDialog: (isShow: boolean) => void;
  handleMode: (mode: string) => void;
  handleFetchBooks: () => void;
  handleShelf: (shelfTitle: string) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleCurrentPage: (page: number) => void;
  handleTotalPage: (page: number) => void;
  t: (title: string) => string;
}
export interface BookListState {
  favoriteBooks: number;
  isHideShelfBook: boolean;
  isRefreshing: boolean;
}
