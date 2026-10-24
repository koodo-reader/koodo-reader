import { RouteComponentProps } from "react-router";
import BookModel from "../../../models/Book";

export interface MoreActionProps extends RouteComponentProps<any> {
  book: BookModel;

  currentBook: BookModel;
  left: number;
  top: number;

  isShowExport: boolean;
  isShowDetail: boolean;
  isExceed: boolean;


  handleMoreAction: (isShow: boolean) => void;
  handleFetchBookmarks: () => void;
  handleFetchNotes: () => void;
  t: (title: string) => string;
  handleActionDialog: (isShow: boolean) => void;
}
export interface MoreActionState {
  exportSubmenu?: string;
}
