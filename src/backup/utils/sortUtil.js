// import localforage from "localforage";
const getBookName = books => {
  let nameArr = [];
  books.forEach(item => {
    // console.log(item.name);
    nameArr.push(item.name);
  });
  // console.log(nameArr[0]);
  return nameArr;
};
const getBookIndex = (nameArr, oldNameArr) => {
  let indexArr = [];
  nameArr.forEach(item => {
    // console.log(item, nameArr, oldNameArr, oldNameArr.indexOf(item));
    indexArr.push(oldNameArr.indexOf(item));
  });
  // console.log(indexArr);
  return indexArr;
};
class SortUtil {
  static sortBooks(books, sortCode) {
    if (sortCode.sort === 1 && sortCode.order === 1) {
      // console.log(books);
      let oldNameArr = getBookName(books);
      let nameArr = getBookName(books).sort();

      // console.log(nameArr[0], oldNameArr[0]);
      // console.log(getBookIndex(nameArr, oldNameArr));
      return getBookIndex(nameArr, oldNameArr);
    }
    if (sortCode.sort === 1 && sortCode.order === 2) {
      let oldNameArr = getBookName(books);
      let nameArr = getBookName(books)
        .sort()
        .reverse();
      // console.log(nameArr);
      // console.log(getBookIndex(nameArr, oldNameArr));
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
      // console.log(books, "books");
      for (let i = 0; i < books.length; i++) {
        nameArr.push(i);
      }
      return nameArr.reverse();
    }
  }
}

export default SortUtil;
