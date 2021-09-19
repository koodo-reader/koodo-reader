import BookModel from "../../model/Book";
import { RouteComponentProps } from "react-router";

export interface BookCardProps extends RouteComponentProps<any> {
  book: BookModel;
  currentBook: BookModel;
  isOpenActionDialog: boolean;
  isSelectBook: boolean;
  isSelected: boolean;
  dragItem: string;
  selectedBooks: string[];
  handleReadingBook: (book: BookModel) => void;
  handleActionDialog: (isShowActionDialog: boolean) => void;
  t: (title: string) => string;
  handleDragItem: (key: string) => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
  handleDeleteDialog: (isShow: boolean) => void;
}
export interface BookCardState {
  isOpenConfig: boolean;
  isFavorite: boolean;
  left: number;
  top: number;
}
