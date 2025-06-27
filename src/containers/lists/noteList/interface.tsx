import NoteModel from "../../../models/Note";
import BookModel from "../../../models/Book";

export interface NoteListProps {
  notes: NoteModel[];
  books: BookModel[];
  isSearch: boolean;
  isCollapsed: boolean;
  searchResults: number[];
  tabMode: string;
  handleFetchNotes: () => void;
  t: (title: string) => string;
}
export interface NoteListState {
  tag: string[];
  currentSelectedBook: string;
}
