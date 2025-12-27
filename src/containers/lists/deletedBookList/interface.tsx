import BookModel from "../../../models/Book";
import { RouteComponentProps } from "react-router";
export interface BookListProps extends RouteComponentProps<any> {
  deletedBooks: BookModel[];
  mode: string;
  selectedBooks: string[];
  isCollapsed: boolean;
  isSelectBook: boolean;

  viewMode: string;
  bookSortCode: { sort: number; order: number };
  noteSortCode: { sort: number; order: number };
  handleMode: (mode: string) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleFetchBooks: () => void;
}
export interface BookListState {
  fullBooksData: BookModel[];
}
