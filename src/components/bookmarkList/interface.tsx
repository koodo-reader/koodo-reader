import BookmarkModel from "../../model/Bookmark";
import BookModel from "../../model/Book";
export interface BookmarkListProps {
  currentBook: BookModel;
  currentEpub: any;
  bookmarks: BookmarkModel[];
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
}
export interface BookmarkListState {
  bookmarks: BookmarkModel[];
  deleteIndex: number;
}
