// import localforage from "localforage";
class DeleteUtil {
  static deleteBook(books, bookKey) {
    let deleteIndex;
    // console.log(books);
    for (let i = 0; i < books.length; i++) {
      if (books[i].key === bookKey) {
        deleteIndex = i;
        break;
      }
    }
    // console.log(books);
    books.splice(deleteIndex, 1);
    return books;
  }
  static deleteBookmarks(bookmarks, bookKey) {
    let deleteIndex = [];
    console.log(bookmarks);
    for (let i = 0; i < bookmarks.length; i++) {
      console.log(bookmarks[i].bookKey, bookKey);
      if (bookmarks[i].bookKey === bookKey) {
        deleteIndex.push(i);
      }
    }
    console.log(deleteIndex);
    deleteIndex.forEach(item => {
      bookmarks.splice(item, 1);
    });
    return bookmarks;
  }
  static deleteNotes(notes, bookKey) {
    let deleteIndex = [];
    // console.log(bookmarks);
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].bookKey === bookKey) {
        deleteIndex.push(i);
      }
    }
    deleteIndex.forEach(item => {
      notes.splice(item, 1);
    });
    return notes;
  }
  static deleteDigests(digests, bookKey) {
    let deleteIndex = [];
    console.log("ahhadhg");
    console.log(digests);
    if (digests !== undefined) {
      for (let i = 0; i < digests.length; i++) {
        if (digests[i].bookKey === bookKey) {
          deleteIndex.push(i);
        }
      }
      deleteIndex.forEach(item => {
        digests.splice(item, 1);
      });
    }

    return digests;
  }
  static deleteHighlighters(highlighters, bookKey) {
    let deleteIndex = [];
    // console.log(bookmarks);
    for (let i = 0; i < highlighters.length; i++) {
      if (highlighters[i].bookKey === bookKey) {
        deleteIndex.push(i);
      }
    }
    deleteIndex.forEach(item => {
      highlighters.splice(item, 1);
    });
    return highlighters;
  }
}

export default DeleteUtil;
