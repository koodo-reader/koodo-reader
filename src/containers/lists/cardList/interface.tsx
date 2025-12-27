import BookModel from "../../../models/Book";
import NoteModel from "../../../models/Note";
import { RouteComponentProps } from "react-router";

export interface CardListProps extends RouteComponentProps<any> {
  chapters: any;
  books: BookModel[];
  cards: NoteModel[];
  mode: string;
  isCollapsed: boolean;
  noteSortCode: { sort: number; order: number };
  handleReadingBook: (currentBook: BookModel) => void;
  handleNoteKey: (noteKey: string) => void;
  t: (title: string) => string;
  handleShowPopupNote: (isShowPopupNote: boolean) => void;
  bookNamesMap: { [key: string]: string };
}
export interface CardListStates {
  displayedCards: NoteModel[];
  currentPage: number;
  itemsPerPage: number;
  isLoading: boolean;
}
