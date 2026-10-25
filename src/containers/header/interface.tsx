import Book from "../../models/Book";
export interface HeaderProps {
  handleDrag: (isDrag: boolean) => void;
}

export interface HeaderState {
  isHidePro: boolean;
  isSync: boolean;
  notificationCount: number;
}
