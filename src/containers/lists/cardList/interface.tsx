import BookModel from "../../../model/Book";
import BookmarkModel from "../../../model/Bookmark";
import NoteModel from "../../../model/Note";
import { RouteComponentProps } from "react-router";

export interface CardListProps extends RouteComponentProps<any> {
  currentEpub: any;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  chapters: any;
  books: BookModel[];
  cards: NoteModel[];
  mode: string;
  isCollapsed: boolean;
  noteSortCode: { sort: number; order: number };
  handleReadingBook: (currentBook: BookModel) => void;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
}
export interface CardListStates {
  deleteKey: string;
}
