import BookModel from "../../../models/Book";

export interface EditDialogProps {
  t: (title: string) => string;
  handleFetchBooks: () => void;
  handleEditDialog: (isShow: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;

  isOpenDeleteDialog: boolean;
  currentBook: BookModel;
}

export interface EditDialogState {
  isCheck: boolean;
}
