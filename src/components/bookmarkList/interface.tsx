import BookmarkModel from "../../model/Bookmark";
import BookModel from "../../model/Book";
export interface BookmarkListProps {
  currentBook: BookModel;
  currentEpub: any;
  bookmarks: BookmarkModel[];
}
export interface BookmarkListState {
  bookmarks: BookmarkModel[];
}
