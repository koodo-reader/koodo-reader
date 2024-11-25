import BookModel from "../../models/Book";
class RecordRecent {
  static setRecent(bookKey: string) {
    let bookArr =
      localStorage.getItem("recentBooks") !== "{}" &&
      localStorage.getItem("recentBooks")
        ? JSON.parse(localStorage.getItem("recentBooks") || "")
        : [];
    const index = bookArr.indexOf(bookKey);
    if (index > -1) {
      bookArr.splice(index, 1);
      bookArr.unshift(bookKey);
    } else {
      bookArr.unshift(bookKey);
    }

    localStorage.setItem("recentBooks", JSON.stringify(bookArr));
  }
  static setAllRecent(books: BookModel[]) {
    let bookArr: string[] = [];
    books.forEach((item) => {
      bookArr.push(item.key);
    });
    localStorage.setItem("recentBooks", JSON.stringify(bookArr));
  }

  static clear(bookKey: string) {
    let bookArr =
      localStorage.getItem("recentBooks") !== "{}" &&
      localStorage.getItem("recentBooks")
        ? JSON.parse(localStorage.getItem("recentBooks") || "")
        : [];
    const index = bookArr.indexOf(bookKey);
    if (index > -1) {
      bookArr.splice(index, 1);
    }
    localStorage.setItem("recentBooks", JSON.stringify(bookArr));
  }
  static getAllRecent() {
    let bookArr =
      localStorage.getItem("recentBooks") !== "{}" &&
      localStorage.getItem("recentBooks")
        ? JSON.parse(localStorage.getItem("recentBooks") || "")
        : [];
    return bookArr || [];
  }
}

export default RecordRecent;
