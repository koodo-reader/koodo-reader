import BookModel from "../../models/Book";
class AddTrash {
  static setTrash(bookKey: string) {
    let bookArr =
      localStorage.getItem("deletedBooks") !== "{}" &&
      localStorage.getItem("deletedBooks")
        ? JSON.parse(localStorage.getItem("deletedBooks") || "")
        : [];
    const index = bookArr.indexOf(bookKey);
    if (index > -1) {
      bookArr.splice(index, 1);
      bookArr.unshift(bookKey);
    } else {
      bookArr.unshift(bookKey);
    }

    localStorage.setItem("deletedBooks", JSON.stringify(bookArr));
  }
  static setAllTrash(books: BookModel[]) {
    let bookArr: string[] = [];
    books.forEach((item) => {
      bookArr.push(item.key);
    });
    localStorage.setItem("deletedBooks", JSON.stringify(bookArr));
  }
  static clear(bookKey: string) {
    let bookArr =
      localStorage.getItem("deletedBooks") !== "{}" &&
      localStorage.getItem("deletedBooks")
        ? JSON.parse(localStorage.getItem("deletedBooks") || "")
        : [];
    const index = bookArr.indexOf(bookKey);
    if (index > -1) {
      bookArr.splice(index, 1);
    }
    localStorage.setItem("deletedBooks", JSON.stringify(bookArr));
  }
  static getAllTrash() {
    let bookArr =
      localStorage.getItem("deletedBooks") !== "{}" &&
      localStorage.getItem("deletedBooks")
        ? JSON.parse(localStorage.getItem("deletedBooks") || "")
        : [];
    return bookArr || [];
  }
}

export default AddTrash;
