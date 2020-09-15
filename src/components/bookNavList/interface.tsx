import BookmarkModel from "../../model/Bookmark";
import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
export interface BookNavListProps {
  currentBook: BookModel;
  currentEpub: any;
  bookmarks: BookmarkModel[];
  notes: NoteModel[];
  digests: NoteModel[];
  currentTab: string;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
}
export interface BookNavListState {
  deleteIndex: number;
}
