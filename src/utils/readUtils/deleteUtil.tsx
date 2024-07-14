import BookModel from "../../models/Book";
import NoteModel from "../../models/Note";
import BookmarkModel from "../../models/Bookmark";
class DeleteUtil {
  static deleteBook(books: BookModel[], bookKey: string) {
    books = books.filter((item) => item.key !== bookKey);
    return books;
  }
  static deleteBookmarks(bookmarks: BookmarkModel[], bookKey: string) {
    bookmarks = bookmarks.filter((item) => item.bookKey !== bookKey);
    return bookmarks;
  }
  static deleteNotes(notes: NoteModel[], bookKey: string) {
    notes = notes.filter((item) => item.bookKey !== bookKey);
    return notes;
  }
}

export default DeleteUtil;
