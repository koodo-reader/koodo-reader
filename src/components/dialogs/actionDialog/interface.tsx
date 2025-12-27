import { RouteComponentProps } from "react-router";
import BookModel from "../../../models/Book";

export interface ActionDialogProps extends RouteComponentProps<any> {
  book: BookModel;

  deletedBooks: BookModel[];

  currentBook: BookModel;
  left: number;
  top: number;
  mode: string;
  isSelectBook: boolean;

  handleFetchBooks: () => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleFetchBookmarks: () => void;
  handleFetchNotes: () => void;
  t: (title: string) => string;
  handleReadingBook: (book: BookModel) => void;
  handleEditDialog: (isShow: boolean) => void;
  handleAddDialog: (isShow: boolean) => void;
  handleActionDialog: (isShow: boolean) => void;
  handleDetailDialog: (isShow: boolean) => void;
  handleSelectBook: (isSelectBook: boolean) => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
}
export interface ActionDialogState {
  isShowExport: boolean;
  isShowDetail: boolean;
  isExceed: boolean;
}
