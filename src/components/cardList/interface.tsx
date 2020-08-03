import BookModel from "../../model/Book";
import BookmarkModel from "../../model/Bookmark";
import NoteModel from "../../model/Note";

export interface CardListProps {
  currentEpub: any;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  chapters: any;
  books: BookModel[];
  epubs: any;
  cards: NoteModel[];
  mode: string;
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (currentBook: BookModel) => void;
  handleReadingEpub: (currentEpub: any) => void;
}
export interface CardListStates {
  deleteKey: string;
}
