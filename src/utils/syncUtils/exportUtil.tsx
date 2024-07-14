import Book from "../../models/Book";
import DictHistory from "../../models/DictHistory";
import Note from "../../models/Note";
import BookUtil from "../fileUtils/bookUtil";
import { zipFilesToBlob } from "./common";

declare var window: any;
let year = new Date().getFullYear(),
  month = new Date().getMonth() + 1,
  day = new Date().getDate();
export const exportBooks = async (books: Book[]) => {
  let fetchPromises = BookUtil.FetchAllBooks(books);
  let booksBuffers: any[] = [];

  for (let index = 0; index < fetchPromises.length; index++) {
    booksBuffers.push(await fetchPromises[index]);
  }
  let bookNames = books.map((item) => {
    return item.name + `.${item.format.toLocaleLowerCase()}`;
  });

  window.saveAs(
    await zipFilesToBlob(booksBuffers, bookNames),
    "KoodoReader-Book-" +
      `${year}-${month <= 9 ? "0" + month : month}-${
        day <= 9 ? "0" + day : day
      }.zip`
  );
};

export const exportNotes = (notes: Note[], books: Book[]) => {
  let data = notes.map((item) => {
    return {
      ...item,
      date: `${item.date.year}-${
        item.date.month <= 9 ? "0" + item.date.month : item.date.month
      }-${item.date.day <= 9 ? "0" + item.date.day : item.date.day}`,
      tag: item.tag.join(","),
      color: [
        ...["#FBF1D1", "#EFEEB0", "#CAEFC9", "#76BEE9"],
        ...["#FF0000", "#000080", "#0000FF", "#2EFF2E"],
      ][item.color],
      highlightType: item.color > 3 ? "line" : "background",
      bookName: books.filter((subitem) => subitem.key === item.bookKey)[0].name,
      bookAuthor: books.filter((subitem) => subitem.key === item.bookKey)[0]
        .author,
    };
  });
  window.saveAs(
    new Blob([convertArrayToCSV(data)], { type: "text/csv,charset=UTF-8" }),
    "KoodoReader-Note-" +
      `${year}-${month <= 9 ? "0" + month : month}-${
        day <= 9 ? "0" + day : day
      }.csv`
  );
};

export const exportHighlights = (highlights: Note[], books: Book[]) => {
  let data = highlights.map((item) => {
    let highlight = {
      ...item,
      date: `${item.date.year}-${
        item.date.month <= 9 ? "0" + item.date.month : item.date.month
      }-${item.date.day <= 9 ? "0" + item.date.day : item.date.day}`,
      tag: item.tag.join(","),
      color: [
        ...["#FBF1D1", "#EFEEB0", "#CAEFC9", "#76BEE9"],
        ...["#FF0000", "#000080", "#0000FF", "#2EFF2E"],
      ][item.color],
      highlightType: item.color > 3 ? "line" : "background",
      bookName: books.filter((subitem) => subitem.key === item.bookKey)[0].name,
      bookAuthor: books.filter((subitem) => subitem.key === item.bookKey)[0]
        .author,
    };
    const { notes, ...rest } = highlight;
    return rest;
  });
  window.saveAs(
    new Blob([convertArrayToCSV(data)], { type: "text/csv,charset=UTF-8" }),
    "KoodoReader-Highlight-" +
      `${year}-${month <= 9 ? "0" + month : month}-${
        day <= 9 ? "0" + day : day
      }.csv`
  );
};
export const exportDictionaryHistory = (
  dictHistory: DictHistory[],
  books: Book[]
) => {
  let data = dictHistory.map((item) => {
    let history = {
      ...item,
      date: `${item.date.year}-${
        item.date.month <= 9 ? "0" + item.date.month : item.date.month
      }-${item.date.day <= 9 ? "0" + item.date.day : item.date.day}`,
      bookName: books.filter((subitem) => subitem.key === item.bookKey)[0].name,
      bookAuthor: books.filter((subitem) => subitem.key === item.bookKey)[0]
        .author,
    };
    return history;
  });

  window.saveAs(
    new Blob([convertArrayToCSV(data)], { type: "text/csv,charset=UTF-8" }),
    "KoodoReader-Dictionary-History-" +
      `${year}-${month <= 9 ? "0" + month : month}-${
        day <= 9 ? "0" + day : day
      }.csv`
  );
};
export const convertArrayToCSV = (array) => {
  let csvContent = "\ufeff";
  csvContent += Object.keys(array[0]).join(",") + "\n";
  array.forEach((item) => {
    csvContent +=
      Object.values(item)
        .map((cell) => {
          if (
            typeof cell === "string" &&
            (cell.includes(",") || cell.includes("\n") || cell.includes("s"))
          ) {
            // 如果单元格内容包含逗号或换行符，则将其用双引号括起来，并将内部的双引号替换为两个双引号
            return '"' + cell.replace(/"/g, '""') + '"';
          } else {
            return cell;
          }
        })
        .join(",") + "\n";
  });
  return csvContent;
};
