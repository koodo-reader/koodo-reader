import BookModel from "../model/Book";
import NoteModel from "../model/Note";
import DigestModel from "../model/Digest";
import HighligherModel from "../model/Highlighter";
import BookmarkModel from "../model/Bookmark";
class DeleteUtil {
  static deleteBook(books: BookModel[], bookKey: string) {
    let deleteIndex=-1;
    for (let i = 0; i < books.length; i++) {
      if (books[i].key === bookKey) {
        deleteIndex = i;
        break;
      }
    }
    books.splice(deleteIndex, 1);
    return books;
  }
  static deleteBookmarks(bookmarks: BookmarkModel[], bookKey: string) {
    let deleteIndex = [];
    for (let i = 0; i < bookmarks.length; i++) {
      if (bookmarks[i].bookKey === bookKey) {
        deleteIndex.push(i);
      }
    }
    deleteIndex.forEach((item) => {
      bookmarks.splice(item, 1);
    });
    return bookmarks;
  }
  static deleteNotes(notes: NoteModel[], bookKey: string) {
    let deleteIndex = [];
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].bookKey === bookKey) {
        deleteIndex.push(i);
      }
    }
    deleteIndex.forEach((item) => {
      notes.splice(item, 1);
    });
    return notes;
  }
  static deleteDigests(digests: DigestModel[], bookKey: string) {
    let deleteIndex = [];
    if (digests !== undefined) {
      for (let i = 0; i < digests.length; i++) {
        if (digests[i].bookKey === bookKey) {
          deleteIndex.push(i);
        }
      }
      deleteIndex.forEach((item) => {
        digests.splice(item, 1);
      });
    }

    return digests;
  }
  static deleteHighlighters(highlighters: HighligherModel[], bookKey: string) {
    let deleteIndex = [];
    for (let i = 0; i < highlighters.length; i++) {
      if (highlighters[i].bookKey === bookKey) {
        deleteIndex.push(i);
      }
    }
    deleteIndex.forEach((item) => {
      highlighters.splice(item, 1);
    });
    return highlighters;
  }
}

export default DeleteUtil;
