import BookModel from "../model/Book";
const getBookName = (books: BookModel[]) => {
  let nameArr = [];
  books.forEach((item: BookModel) => {
    nameArr.push(item.name);
  });
  return nameArr;
};
const getBookIndex = (nameArr: string[], oldNameArr: string[]) => {
  let indexArr = [];
  nameArr.forEach((item) => {
    indexArr.push(oldNameArr.indexOf(item));
  });
  return indexArr;
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
  }
}

export default SortUtil;
