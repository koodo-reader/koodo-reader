import BookModel from "../../../models/Book";

export interface MoreActionProps {
  book: BookModel;

  left: number;
  top: number;

  isShowExport: boolean;
  isShowDetail: boolean;
  isExceed: boolean;


  handleMoreAction: (isShow: boolean) => void;
  handleFetchBookmarks: () => void;
  handleFetchNotes: () => void;
}
export interface MoreActionState {
  exportSubmenu?: string;
}
