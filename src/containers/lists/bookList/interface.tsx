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



  handleAddDialog: (isShow: boolean) => void;

  handleFetchBooks: () => void;


  handleLoadMore: (isLoadMore: boolean) => void;
  t: (title: string) => string;
}
export interface BookListState {
  favoriteBooks: number;
  isHideShelfBook: boolean;
  displayedBooksCount: number;
  isLoadingMore: boolean;
  fullBooksData: BookModel[];
  cardScale: number;
  readingStatusFilter: string;
}
