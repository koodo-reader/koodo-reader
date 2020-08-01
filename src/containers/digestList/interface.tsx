import BookModel from "../../model/Book";
import BookmarkModel from "../../model/Bookmark";
import DigestModel from "../../model/Digest";

export interface DigestListProps {
  currentEpub: any;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  chapters: any;
  books: BookModel[];
  epubs: any;
  digests: DigestModel[];
  handleReadingState: (isReading: boolean) => void;
  handleReadingBook: (currentBook: BookModel) => void;
  handleReadingEpub: (currentEpub: any) => void;
}
export interface DigestListStates {
  deleteKey: string;
}
