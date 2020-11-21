import BookModel from "../../model/Book";
import { RouteComponentProps } from "react-router";
export interface BookListProps extends RouteComponentProps<any> {
  books: BookModel[];
  deletedBooks: BookModel[];
  mode: string;
  isSort: boolean;
  isList: string;
  sortCode: { sort: number; order: number };
  handleFetchList: () => void;
  handleMode: (mode: string) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleFetchBooks: (isTrash: boolean) => void;
}
export interface BookListState {}
