import BookModel from "../../model/Book";
import BookmarkModel from "../../model/Bookmark";
import DigestModel from "../../model/Digest";

export interface DigestListProps {
  currentEpub: any;
  currentBook: BookModel;
  bookmarks: BookmarkModel[];
  chapters: any;
  books: BookModel[];
  digests: DigestModel[];
}
