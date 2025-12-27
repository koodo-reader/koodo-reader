import BookModel from "../../models/Book";
import { RouteComponentProps } from "react-router";
export interface ImportLocalProps extends RouteComponentProps<any> {
  books: BookModel[];
  deletedBooks: BookModel[];
  dragItem: string;

  isCollapsed: boolean;
  isAuthed: boolean;
  mode: string;
  shelfTitle: string;

  handleFetchBooks: () => void;
  handleDrag: (isDrag: boolean) => void;
  handleImportDialog: (isOpenImportDialog: boolean) => void;
  handleImportBookFunc: (importBookFunc: (file: any) => Promise<void>) => void;
  handleReadingBook: (book: BookModel) => void;
  t: (title: string) => string;
}
export interface ImportLocalState {
  isOpenFile: boolean;
  isMoreOptionsVisible: boolean;
  width: number;
}
