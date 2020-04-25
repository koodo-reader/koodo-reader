import BookModel from "../model/Book";

class OtherUtil {
  static fuzzyQuery(list: string[], keyWord: string) {
    var arr = [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].match(keyWord) != null) {
        arr.push(i);
      }
    }
    return arr;
  }
  static MergeArray(arr1: number[], arr2: number[]) {
    var _arr = [];
    for (let i = 0; i < arr1.length; i++) {
      _arr.push(arr1[i]);
    }
    for (let i = 0; i < arr2.length; i++) {
      var flag = true;
      for (let j = 0; j < arr1.length; j++) {
        if (arr2[i] === arr1[j]) {
          flag = false;
          break;
        }
      }
      if (flag) {
        _arr.push(arr2[i]);
      }
    }
    return _arr;
  }
  static MouseSearch(books: BookModel[]) {
    let keyword = (document.querySelector(
      ".header-search-box"
    ) as HTMLInputElement).value;
    let bookNameArr = [];
    let AuthorNameArr = [];
    books.forEach((item) => {
      bookNameArr.push(item.name.toLowerCase());
      AuthorNameArr.push(item.author.toLowerCase());
    });
    let bookResults = this.fuzzyQuery(bookNameArr, keyword);
    let authorResults = this.fuzzyQuery(AuthorNameArr, keyword);
    let results = this.MergeArray(bookResults, authorResults);
    return results;
  }
  static KeySearch(event, books: BookModel[]) {
    if (event && event.keyCode === 13) {
      let bookNameArr = [];
      let AuthorNameArr = [];
      books.forEach((item) => {
        bookNameArr.push(item.name.toLowerCase());
        AuthorNameArr.push(item.author.toLowerCase());
      });
      let bookResults = this.fuzzyQuery(bookNameArr, event.target.value);
      let authorResults = this.fuzzyQuery(AuthorNameArr, event.target.value);
      let results = this.MergeArray(bookResults, authorResults);
      return results;
    }
  }
  static setSortCode(sortCode: number, orderCode: number) {
    let json = localStorage.getItem("sortCode");
    let obj = JSON.parse(json) || { sort: 2, order: 2 };
    obj.sort = sortCode;
    obj.order = orderCode;
    localStorage.setItem("sortCode", JSON.stringify(obj));
  }

  static getSortCode() {
    let json = localStorage.getItem("sordCode");
    let obj = JSON.parse(json) || { sort: 2, order: 2 };
    return obj || null;
  }
}

export default OtherUtil;
