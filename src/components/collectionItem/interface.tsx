import { RouteComponentProps } from "react-router";
import CollectionModel from "../../models/Collection";
import BookModel from "../../models/Book";

export interface CollectionItemProps extends RouteComponentProps<any> {
  collection: CollectionModel;
  viewMode: string;
  cardScale?: number;
  isCollapsed?: boolean;
  currentBook: BookModel;
  isOpenActionDialog: boolean;
  isSelectBook: boolean;
  isSelected: boolean;
  selectedBooks: string[];
  refreshBookKey: string;
  allBooks?: { key: string }[];
  bookIndex?: number;
  handleReadingBook: (book: BookModel) => void;
  handleSelectBook: (isSelectBook: boolean) => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
  handleActionDialog: (isOpen: boolean) => void;
  handleFetchBooks: () => void;
  handleCollectionDialog: (isOpen: boolean) => void;
  handleCollectionDialogMode: (mode: string) => void;
  handleCollectionDialogBooks: (books: string[]) => void;
  handleCollectionDialogKey: (key: string) => void;
  handleCollectionDetailDialog: (isOpen: boolean) => void;
  handleCurrentCollectionKey: (key: string) => void;
  t: (title: string) => string;
}
