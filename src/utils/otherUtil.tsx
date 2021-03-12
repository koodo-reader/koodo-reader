import BookModel from "../model/Book";
import NoteModel from "../model/Note";

class OtherUtil {
  static fuzzyQuery(list: string[], keyWord: string) {
    var arr: number[] = [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].match(keyWord) != null) {
        arr.push(i);
      }
    }
    return arr;
  }
  static MergeArray(arr1: number[], arr2: number[]) {
    var _arr: number[] = [];
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
    ) as HTMLInputElement).value.toLowerCase();
    let bookNameArr: string[] = [];
    let AuthorNameArr: string[] = [];
    if (!books) return [];
    books.forEach((item) => {
      bookNameArr.push(item.name.toLowerCase());
      AuthorNameArr.push(item.author.toLowerCase());
    });
    let bookResults = this.fuzzyQuery(bookNameArr, keyword);
    let authorResults = this.fuzzyQuery(AuthorNameArr, keyword);
    let results = this.MergeArray(bookResults, authorResults);
    return results;
  }
  static KeySearch(event: any, books: BookModel[]) {
    if (event && event.keyCode === 13) {
      let bookNameArr: string[] = [];
      let AuthorNameArr: string[] = [];
      if (!books) return [];

      books.forEach((item) => {
        bookNameArr.push(item.name.toLowerCase());
        AuthorNameArr.push(item.author.toLowerCase());
      });
      let bookResults = this.fuzzyQuery(
        bookNameArr,
        event.target.value.toLowerCase()
      );
      let authorResults = this.fuzzyQuery(
        AuthorNameArr,
        event.target.value.toLowerCase()
      );
      let results = this.MergeArray(bookResults, authorResults);
      return results;
    }
  }
  static MouseNoteSearch(notes: NoteModel[]) {
    let keyword = (document.querySelector(
      ".header-search-box"
    ) as HTMLInputElement).value.toLowerCase();
    let noteArr: string[] = [];
    let textArr: string[] = [];
    notes.forEach((item: NoteModel) => {
      noteArr.push(item.notes.toLowerCase());
      textArr.push(item.text.toLowerCase());
    });
    let noteResults = this.fuzzyQuery(noteArr, keyword);
    let textResults = this.fuzzyQuery(textArr, keyword);
    let results = this.MergeArray(noteResults, textResults);
    return results;
  }
  static KeyNoteSearch(event: any, notes: NoteModel[]) {
    if (event && event.keyCode === 13) {
      let noteArr: string[] = [];
      let textArr: string[] = [];
      notes.forEach((item: NoteModel) => {
        noteArr.push(item.notes.toLowerCase());
        textArr.push(item.text.toLowerCase());
      });
      let noteResults = this.fuzzyQuery(
        noteArr,
        event.target.value.toLowerCase()
      );
      let textResults = this.fuzzyQuery(
        textArr,
        event.target.value.toLowerCase()
      );
      let results = this.MergeArray(noteResults, textResults);
      return results;
    }
  }
  static setBookSortCode(sortCode: number, orderCode: number) {
    let json =
      localStorage.getItem("bookSortCode") ||
      JSON.stringify({ sort: 0, order: 1 });
    let obj = json ? JSON.parse(json) : { sort: 0, order: 1 };
    obj.sort = sortCode;
    obj.order = orderCode;
    localStorage.setItem("bookSortCode", JSON.stringify(obj));
  }

  static getBookSortCode() {
    let json =
      localStorage.getItem("bookSortCode") ||
      JSON.stringify({ sort: 0, order: 1 });
    let obj = JSON.parse(json) || { sort: 0, order: 1 };
    return obj || null;
  }
  static setNoteSortCode(sort: number, order: number) {
    let json =
      localStorage.getItem("noteSortCode") ||
      JSON.stringify({ sort: 2, order: 2 });
    let obj = json ? JSON.parse(json) : { sort: 2, order: 2 };
    obj.sort = sort;
    obj.order = order;
    localStorage.setItem("noteSortCode", JSON.stringify(obj));
  }

  static getNoteSortCode() {
    let json =
      localStorage.getItem("noteSortCode") ||
      JSON.stringify({ sort: 2, order: 2 });
    let obj = JSON.parse(json) || { sort: 2, order: 2 };
    return obj || null;
  }
  static getReaderConfig(key: string) {
    let readerConfig = JSON.parse(localStorage.getItem("readerConfig")!) || {};
    return readerConfig[key];
  }
  static setReaderConfig(key: string, value: string) {
    let readerConfig = JSON.parse(localStorage.getItem("readerConfig")!) || {};
    readerConfig[key] = value;
    localStorage.setItem("readerConfig", JSON.stringify(readerConfig));
  }
}

export default OtherUtil;
