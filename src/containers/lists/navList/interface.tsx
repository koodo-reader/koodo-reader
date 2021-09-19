import BookmarkModel from "../../../model/Bookmark";
import BookModel from "../../../model/Book";
import NoteModel from "../../../model/Note";
export interface NavListProps {
  currentBook: BookModel;
  currentEpub: any;
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  digests: NoteModel[];
  currentTab: string;
  t: (title: string) => string;
}
export interface NavListState {
  deleteIndex: number;
}
