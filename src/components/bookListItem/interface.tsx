import BookModel from "../../model/Book";
import { RouteComponentProps } from "react-router";

export interface BookItemProps extends RouteComponentProps<any> {
  book: BookModel;
  percentage: number;
  handleReadingBook: (book: BookModel) => void;
  handleEditDialog: (isShow: boolean) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleAddDialog: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
}
export interface BookItemState {
  isDeleteDialog: boolean;
  isFavorite: boolean;
}
