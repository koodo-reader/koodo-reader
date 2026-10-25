import BookModel from "../../../models/Book";

export interface MarkActionProps {
  left: number;
  top: number;
  isShowMark: boolean;
  isExceed: boolean;
  menuItemIndex?: number;
  handleMarkAction: (isShow: boolean) => void;
}
