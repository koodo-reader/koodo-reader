import { RouteComponentProps } from "react-router";
import BookModel from "../../../models/Book";

export interface MoreActionProps extends RouteComponentProps<any> {
  book: BookModel;
  deletedBooks: BookModel[];
  currentBook: BookModel;
  left: number;
  top: number;
  isSelectBook: boolean;
  isShowExport: boolean;
  isShowDetail: boolean;
  isExceed: boolean;
  handleFetchBooks: () => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleMoreAction: (isShow: boolean) => void;
  handleFetchBookmarks: () => void;
  handleFetchNotes: () => void;
  t: (title: string) => string;
  handleActionDialog: (isShow: boolean) => void;
}
export interface MoreActionState {}
