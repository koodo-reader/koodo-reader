import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import ReadingTime from "./readingTime";
import RecordLocation from "./recordLocation";
import _ from "underscore";
//获取所有图书的书名
const getBookName = (books: BookModel[]) => {
  return books.map((item) => item.name);
};
//获取所有作者名
const getAuthorName = (books: BookModel[]) => {
  return books.map((item) => item.author);
};
//获取所有图书的key值
const getBookKey = (books: BookModel[]) => {
  return books.map((item) => item.key);
};
//获取图书索引
const getBookIndex = (nameArr: string[], oldNameArr: string[]) => {
  let indexArr: number[] = [];
  for (let i = 0; i < nameArr.length; i++) {
    if (oldNameArr.indexOf(nameArr[i]) > -1) {
      //如果索引数组已经包含该索引，就把它放在随后一位，取数组长度为索引
      indexArr.push(
        indexArr.indexOf(oldNameArr.indexOf(nameArr[i])) > -1
          ? indexArr.length
          : oldNameArr.indexOf(nameArr[i])
      );
    }
  }
  return indexArr;
};

const getDurationArr = () => {
  let durationObj = ReadingTime.getAllTime();
  var sortable: any[] = [];
  for (let obj in durationObj) {
    sortable.push([obj, durationObj[obj]]);
  }
  sortable.sort(function (a, b) {
    return a[1] - b[1];
  });
  return Object.keys(durationObj);
};
const getPercentageArr = () => {
  let locationObj = RecordLocation.getAllCfi();
  var sortable: any = [];
  for (let obj in locationObj) {
    sortable.push([obj, locationObj[obj].percentage]);
  }
  sortable.sort(function (a, b) {
    return a[1] - b[1];
  });
  return Object.keys(locationObj);
};
class SortUtil {
  static sortBooks(
    books: BookModel[],
    bookSortCode: { sort: number; order: number }
  ) {
    if (bookSortCode.sort === 1) {
      let oldNameArr = getBookName(books);
      let nameArr = getBookName(books).sort();
      if (bookSortCode.order === 1) {
        return getBookIndex(nameArr, oldNameArr);
      } else {
        return getBookIndex(nameArr, oldNameArr).reverse();
      }
    }
    if (bookSortCode.sort === 2) {
      let nameArr: number[] = [];
      for (let i = 0; i < books.length; i++) {
        nameArr.push(i);
      }
      if (bookSortCode.order === 1) {
        return nameArr;
      } else {
        return nameArr.reverse();
      }
    }
    if (bookSortCode.sort === 3) {
      let durationKeys = getDurationArr();

      let bookKeys = getBookKey(books);
      if (bookSortCode.order === 1) {
        return getBookIndex(_.union(durationKeys, bookKeys), bookKeys);
      } else {
        return getBookIndex(
          _.union(durationKeys, bookKeys),
          bookKeys
        ).reverse();
      }
    }
    if (bookSortCode.sort === 4) {
      let oldAuthorArr = getAuthorName(books);
      let authorArr = getAuthorName(books).sort();
      if (bookSortCode.order === 1) {
        return getBookIndex(authorArr, oldAuthorArr);
      } else {
        return getBookIndex(authorArr, oldAuthorArr).reverse();
      }
    }
    if (bookSortCode.sort === 5) {
      let percentagenKeys = getPercentageArr();
      let bookKeys = getBookKey(books);
      if (bookSortCode.order === 1) {
        return getBookIndex(
          _.union(percentagenKeys, bookKeys),
          bookKeys
        ).reverse();
      } else {
        return getBookIndex(_.union(percentagenKeys, bookKeys), bookKeys);
      }
    }
  }
  static sortNotes(
    notes: NoteModel[],
    noteSortCode: { sort: number; order: number },
    books: BookModel[] = []
  ) {
    if (noteSortCode.sort === 2) {
      //使书摘从晚到早排序
      let noteArr = _.clone(notes).reverse();
      let dateArr = _.uniq(
        notes.map(
          (item) =>
            "" + item.date.year + "-" + item.date.month + "-" + item.date.day
        )
      );
      if (noteSortCode.order === 1) {
        dateArr.sort();
      } else {
        dateArr.sort().reverse();
      }
      //得到以日期为键，书摘为值的对象
      let noteObj: { [key: string]: any } = {};
      dateArr.forEach((date) => {
        noteObj[date] = [];
      });
      noteArr.forEach((note) => {
        dateArr.forEach((date) => {
          if (
            date ===
            "" + note.date.year + "-" + note.date.month + "-" + note.date.day
          ) {
            noteObj[date].push(note);
          }
        });
      });
      return noteObj || {};
    }
    if (noteSortCode.sort === 1) {
      //使书摘从晚到早排序
      let noteArr = _.clone(notes).reverse();
      let nameArr = _.uniq(
        notes.map(
          (item) =>
            books[
              _.findLastIndex(books, {
                key: item.bookKey,
              })
            ].name
        )
      );
      if (noteSortCode.order === 1) {
        nameArr.sort();
      } else {
        nameArr.sort().reverse();
      }
      //得到以日期为键，书摘为值的对象
      let noteObj: { [key: string]: any } = {};
      nameArr.forEach((name) => {
        noteObj[name] = [];
      });
      noteArr.forEach((note) => {
        nameArr.forEach((name) => {
          if (
            name ===
            books[
              _.findLastIndex(books, {
                key: note.bookKey,
              })
            ].name
          ) {
            noteObj[name].push(note);
          }
        });
      });
      return noteObj || {};
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
}

export default SortUtil;
