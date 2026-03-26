import BookModel from "../../models/Book";
import { RouteComponentProps } from "react-router";

export interface BookCardProps extends RouteComponentProps<any> {
  book: BookModel;
  currentBook: BookModel;
  isOpenActionDialog: boolean;
  isSelectBook: boolean;
  isSelected: boolean;
  dragItem: string;
  selectedBooks: string[];
  refreshBookKey: string;
  handleSelectBook: (isSelectBook: boolean) => void;
  handleReadingBook: (book: BookModel) => void;
  handleActionDialog: (isShowActionDialog: boolean) => void;
  t: (title: string) => string;
  handleDragItem: (key: string) => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleRefreshBookCover: (key: string) => void;
}
export interface BookCardState {
  isFavorite: boolean;
  isHover: boolean;
  left: number;
  top: number;
  direction: string;
  cover: string;
  isCoverExist: boolean;
  isBookOffline: boolean;
}
