import BookModel from "../model/Book";
import ReadingTime from "./readingTime";
//获取所有图书的书名
const getBookName = (books: BookModel[]) => {
  let nameArr: string[] = [];
  books.forEach((item: BookModel) => {
    nameArr.push(item.name);
  });
  return nameArr;
};
//获取所有图书的key值
const getBookKey = (books: BookModel[]) => {
  let keyArr: string[] = [];
  books.forEach((item: BookModel) => {
    keyArr.push(item.key);
  });
  return keyArr;
};
//
const getBookIndex = (nameArr: string[], oldNameArr: string[]) => {
  let indexArr: number[] = [];
  for (let i = 0; i < nameArr.length; i++) {
    if (oldNameArr.indexOf(nameArr[i]) > -1) {
      indexArr.push(oldNameArr.indexOf(nameArr[i]));
    }
  }
  return indexArr;
};
const getDurationArr = () => {
  let durationObj = ReadingTime.getAllTime();
  var sortable = [];
  for (let obj in durationObj) {
    sortable.push([obj, durationObj[obj]]);
  }
  sortable.sort(function (a, b) {
    return a[1] - b[1];
  });
  return Object.keys(durationObj);
};
class SortUtil {
  static sortBooks(
    books: BookModel[],
    sortCode: { sort: number; order: number }
  ) {
    if (sortCode.sort === 1 && sortCode.order === 1) {
      let oldNameArr = getBookName(books);
      let nameArr = getBookName(books).sort();
      return getBookIndex(nameArr, oldNameArr);
    }
    if (sortCode.sort === 1 && sortCode.order === 2) {
      let oldNameArr = getBookName(books);
      let nameArr = getBookName(books).sort().reverse();
      return getBookIndex(nameArr, oldNameArr);
    }
    if (sortCode.sort === 2 && sortCode.order === 1) {
      let nameArr = [];
      for (let i = 0; i < books.length; i++) {
        nameArr.push(i);
      }
      return nameArr;
    }
    if (sortCode.sort === 2 && sortCode.order === 2) {
      let nameArr = [];
      for (let i = 0; i < books.length; i++) {
        nameArr.push(i);
      }
      return nameArr.reverse();
    }
    if (sortCode.sort === 3 && sortCode.order === 1) {
      let durationKeys = getDurationArr();
      let bookKeys = getBookKey(books);
      return getBookIndex(
        [...new Set(durationKeys.concat(bookKeys))],
        bookKeys
      );
    }
    if (sortCode.sort === 3 && sortCode.order === 2) {
      let durationKeys = getDurationArr();
      let bookKeys = getBookKey(books);
      return getBookIndex(
        [...new Set(durationKeys.concat(bookKeys))],
        bookKeys
      ).reverse();
    }
  }
}

export default SortUtil;
