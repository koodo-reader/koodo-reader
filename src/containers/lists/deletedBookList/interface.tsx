import BookModel from "../../../models/Book";
import { RouteComponentProps } from "react-router";
export interface BookListProps extends RouteComponentProps<any> {
  books: BookModel[];
  deletedBooks: BookModel[];
  mode: string;
  selectedBooks: string[];
  isBookSort: boolean;
  isCollapsed: boolean;
  isSelectBook: boolean;

  viewMode: string;
  bookSortCode: { sort: number; order: number };
  noteSortCode: { sort: number; order: number };
  handleFetchList: () => void;
  handleMode: (mode: string) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleFetchBooks: () => void;
}
export interface BookListState {
  isRefreshing: boolean;
}
