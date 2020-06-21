import NoteModel from "../../model/Note";
import BookModel from "../../model/Book";
import BookmarkModel from "../../model/Bookmark";
export interface NoteListProps {
  notes: NoteModel[];
  currentEpub: any;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  chapters: any;
  books: BookModel[];
}

export interface NoteListState {
  currentDate: string | null;
  currentIndex: number | null;
}
