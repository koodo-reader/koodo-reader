import BookModel from "../../../models/Book";

export interface MarkActionProps {
  left: number;
  top: number;
  isShowMark: boolean;
  isExceed: boolean;
  menuItemIndex?: number;
  handleMarkAction: (isShow: boolean) => void;
  currentBook: BookModel;
  handleActionDialog: (isShow: boolean) => void;
  handleRefreshBookCover: (key: string) => void;
  handleFetchBooks: () => void;
  t: (title: string) => string;
}
