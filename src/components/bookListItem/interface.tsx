import BookModel from "../../models/Book";
import { RouteComponentProps } from "react-router";

export interface BookItemProps extends RouteComponentProps<any> {
  book: BookModel;
  percentage: number;
  currentBook: BookModel;
  dragItem: string;
  mode: string;
  isOpenActionDialog: boolean;

  isSelectBook: boolean;
  isSelected: boolean;
  selectedBooks: string[];
  handleSelectBook: (isSelectBook: boolean) => void;

  handleReadingBook: (book: BookModel) => void;
  handleEditDialog: (isShow: boolean) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleAddDialog: (isShow: boolean) => void;
  handleActionDialog: (isShowActionDialog: boolean) => void;

  t: (title: string) => string;
  handleDragItem: (key: string) => void;
  handleFetchBooks: () => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
}
export interface BookItemState {
  isHover: boolean;

  isDeleteDialog: boolean;
  isFavorite: boolean;
  direction: string;
  left: number;
  top: number;
}
