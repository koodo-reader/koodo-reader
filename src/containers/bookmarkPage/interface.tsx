import BookmarkModel from "../../model/Bookmark";
import BookModel from "../../model/Book";
export interface BookmarkPageProps {
  bookmarks: BookmarkModel[];
  covers: { key: string; url: string }[];
  books: BookModel[];
  epubs: any;
  handleFetchBookmarks: () => void;
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (currentBook: BookModel) => void;
  handleReadingEpub: (currentEpub: any) => void;
}
export interface BookmarkPageState {
  bookmarks: BookmarkModel[];
}
