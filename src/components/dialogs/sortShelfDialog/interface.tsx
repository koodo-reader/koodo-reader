import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";
import BookmarkModel from "../../../models/Bookmark";
import { RouteComponentProps } from "react-router-dom";

export interface SortShelfDialogProps extends RouteComponentProps<any> {
  handleSortShelfDialog: (isOpenSortShelfDialog: boolean) => void;
  t: (title: string) => string;
  mode: string;
  handleShelf: (shelfTitle: string) => void;
  handleMode: (mode: string) => void;
}
export interface SortShelfDialogState {
  sortedShelfList: any[];
  currentEditShelf: string;
  currentDeleteShelf: string;
  newShelfName: string;
  isOpenDelete: boolean;
}
