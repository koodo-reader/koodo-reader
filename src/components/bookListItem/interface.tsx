import BookModel from "../../model/Book";
import { RouteComponentProps } from "react-router";

export interface BookItemProps extends RouteComponentProps<any> {
  book: BookModel;
  percentage: number;
  currentBook: BookModel;
  dragItem: string;
  mode: string;
  isSelectBook: boolean;
  isSelected: boolean;
  selectedBooks: string[];
  handleReadingBook: (book: BookModel) => void;
  handleEditDialog: (isShow: boolean) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleAddDialog: (isShow: boolean) => void;
  t: (title: string) => string;
  handleDragItem: (key: string) => void;
  handleFetchBooks: () => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
}
export interface BookItemState {
  isDeleteDialog: boolean;
  isFavorite: boolean;
}
