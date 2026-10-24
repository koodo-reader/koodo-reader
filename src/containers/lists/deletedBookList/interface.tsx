import BookModel from "../../../models/Book";
import { RouteComponentProps } from "react-router";
export interface BookListProps extends RouteComponentProps<any> {
  deletedBooks: BookModel[];

  selectedBooks: string[];
  isCollapsed: boolean;


  viewMode: string;



  handleDeleteDialog: (isShow: boolean) => void;
  handleFetchBooks: () => void;
}
export interface BookListState {
  fullBooksData: BookModel[];
}
