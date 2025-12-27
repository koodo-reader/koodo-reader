import BookModel from "../../../models/Book";
import { RouteComponentProps } from "react-router";

export interface DeleteDialogProps extends RouteComponentProps<any> {
  books: BookModel[];
  deletedBooks: BookModel[];
  isSearch: boolean;
  isOpenDeleteDialog: boolean;
  currentBook: BookModel;

  mode: string;
  shelfTitle: string;
  selectedBooks: string[];
  isSelectBook: boolean;
  handleFetchBooks: () => void;
  handleSelectBook: (isSelectBook: boolean) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;
  handleFetchBookmarks: () => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
  handleFetchNotes: () => void;
  handleSearch: (isSearch: boolean) => void;
  t: (title: string) => string;
}
export interface DeleteDialogState {
  isDeleteShelfBook: boolean;
  isDisableTrashBin: boolean;
}
