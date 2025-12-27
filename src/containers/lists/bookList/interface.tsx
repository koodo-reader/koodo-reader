import BookModel from "../../../models/Book";
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
  isSelectBook: boolean;
  viewMode: string;
  selectedBooks: string[];

  bookSortCode: { sort: number; order: number };
  noteSortCode: { sort: number; order: number };
  handleAddDialog: (isShow: boolean) => void;
  handleMode: (mode: string) => void;
  handleFetchBooks: () => void;
  handleShelf: (shelfTitle: string) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleLoadMore: (isLoadMore: boolean) => void;
  t: (title: string) => string;
}
export interface BookListState {
  favoriteBooks: number;
  isHideShelfBook: boolean;
  displayedBooksCount: number;
  isLoadingMore: boolean;
  fullBooksData: BookModel[];
}
