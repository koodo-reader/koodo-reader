import BookModel from "../../../models/Book";
import { RouteComponentProps } from "react-router-dom";
export interface EditDialogProps extends RouteComponentProps<any> {
  t: (title: string) => string;
  handleFetchBooks: () => void;
  handleEditDialog: (isShow: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;
  handleRefreshBookCover: (key: string) => void;

  isOpenDeleteDialog: boolean;
  currentBook: BookModel;
}

export interface EditDialogState {
  isCheck: boolean;
  coverPreview: string;
}
