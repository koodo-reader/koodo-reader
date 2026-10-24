import BookModel from "../../models/Book";
import { RouteComponentProps } from "react-router";
export interface BookListProps extends RouteComponentProps<any> {
  books: BookModel[];

  shelfTitle: string;

  searchResults: any[];
  isSelectBook: boolean;
  isSearch: boolean;
  isCollapsed: boolean;
  selectedBooks: string[];
  handleAddDialog: (isShow: boolean) => void;
  t: (title: string) => string;
  handleDeleteDialog: (isShow: boolean) => void;
  handleSelectBook: (isSelectBook: boolean) => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
  handleCollectionDialogBooks: (books: string[]) => void;
  handleAddCollectionDialog: (isOpen: boolean) => void;
}
export interface BookListState {
  isShowExport: boolean;


  exportSubmenu: string;
}
