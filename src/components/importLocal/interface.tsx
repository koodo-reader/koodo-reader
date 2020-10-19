import BookModel from "../../model/Book";
import { RouteComponentProps } from "react-router";
export interface ImportLocalProps extends RouteComponentProps<any> {
  books: BookModel[];
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleFetchBooks: () => void;
}
export interface ImportLocalState {}
