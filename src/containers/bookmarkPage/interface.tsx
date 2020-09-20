import BookmarkModel from "../../model/Bookmark";
import BookModel from "../../model/Book";

export interface BookmarkPageProps {
  bookmarks: BookmarkModel[];
  books: BookModel[];
  handleFetchBookmarks: () => void;
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (currentBook: BookModel) => void;
  handleReadingEpub: (currentEpub: any) => void;
}
export interface BookmarkPageState {
  bookmarks: BookmarkModel[];
}
