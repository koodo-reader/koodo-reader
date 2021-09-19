import BookModel from "../../model/Book";
import { RouteComponentProps } from "react-router";

export interface BookCoverProps extends RouteComponentProps<any> {
  book: BookModel;
  currentBook: BookModel;
  isOpenActionDialog: boolean;
  isCollapsed: boolean;
  dragItem: string;
  isSelectBook: boolean;
  isSelected: boolean;
  selectedBooks: string[];
  handleReadingBook: (book: BookModel) => void;
  handleActionDialog: (isShowActionDialog: boolean) => void;
  t: (title: string) => string;
  handleDragItem: (key: string) => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
  handleDeleteDialog: (isShow: boolean) => void;
}
export interface BookCoverState {
  isOpenConfig: boolean;
  isFavorite: boolean;
  left: number;
  top: number;
}
