// 记录书本打开记录
import BookModel from "../model/Book";
class AddFavorite {
  static setFavorite(bookKey: string) {
    let bookArr =
      localStorage.getItem("favoriteBooks") !== "{}" &&
      localStorage.getItem("favoriteBooks")
        ? JSON.parse(localStorage.getItem("favoriteBooks") || "")
        : [];
    const index = bookArr.indexOf(bookKey);
    if (index > -1) {
      bookArr.splice(index, 1);
      bookArr.unshift(bookKey);
    } else {
      bookArr.unshift(bookKey);
    }

    localStorage.setItem("favoriteBooks", JSON.stringify(bookArr));
  }
  static setAllFavorite(books: BookModel[]) {
    let bookArr: string[] = [];
    books.forEach((item) => {
      bookArr.push(item.key);
    });
    localStorage.setItem("favoriteBooks", JSON.stringify(bookArr));
  }
  static clear(bookKey: string) {
    let bookArr =
      localStorage.getItem("favoriteBooks") !== "{}" &&
      localStorage.getItem("favoriteBooks")
        ? JSON.parse(localStorage.getItem("favoriteBooks") || "")
        : [];
    const index = bookArr.indexOf(bookKey);
    if (index > -1) {
      bookArr.splice(index, 1);
    }
    localStorage.setItem("favoriteBooks", JSON.stringify(bookArr));
  }
  static getAllFavorite() {
    let bookArr =
      localStorage.getItem("favoriteBooks") !== "{}" &&
      localStorage.getItem("favoriteBooks")
        ? JSON.parse(localStorage.getItem("favoriteBooks") || "")
        : [];
    return bookArr || [];
  }
}

export default AddFavorite;
