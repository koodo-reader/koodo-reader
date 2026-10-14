import BookModel from "../../models/Book";
import { RouteComponentProps } from "react-router";

export interface BookCoverProps extends RouteComponentProps<any> {
  book: BookModel;
  currentBook: BookModel;
  isOpenActionDialog: boolean;
  isCollapsed: boolean;
  isSelectBook: boolean;
  isSelected: boolean;
  selectedBooks: string[];
  refreshBookKey: string;
  allBooks?: BookModel[];
  bookIndex?: number;
  handleSelectBook: (isSelectBook: boolean) => void;
  handleRefreshBookCover: (key: string) => void;
  handleReadingBook: (book: BookModel) => void;
  handleActionDialog: (isShowActionDialog: boolean) => void;
  t: (title: string) => string;
  handleSelectedBooks: (selectedBooks: string[]) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleFetchBooks: () => void;
  handleCollectionDialog: (isOpen: boolean) => void;
  handleCollectionDialogMode: (mode: string) => void;
  handleCollectionDialogBooks: (books: string[]) => void;
  handleCollectionDialogKey: (key: string) => void;
}
export interface BookCoverState {
  isHover: boolean;

  isFavorite: boolean;
  left: number;
  top: number;
  direction: string;
  desc: string;
  cover: string;
  isCoverExist: boolean;
  isBookOffline: boolean;
}
