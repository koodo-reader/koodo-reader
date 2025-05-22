import Book from "../../models/Book";
import DictHistory from "../../models/DictHistory";
import Note from "../../models/Note";
import BookUtil from "./bookUtil";
import JSZip from "jszip";
import { saveAs } from "file-saver";
export const zipFilesToBlob = (buffers: ArrayBuffer[], names: string[]) => {
  var zip = new JSZip();
  for (let index = 0; index < buffers.length; index++) {
    zip.file(names[index], buffers[index]);
  }
  return zip.generateAsync({ type: "blob" });
};

declare var window: any;
let year = new Date().getFullYear(),
  month = new Date().getMonth() + 1,
  day = new Date().getDate();

export const exportBooks = async (books: Book[]) => {
  let fetchPromises = BookUtil.fetchAllBooks(books);
  let booksBuffers: any[] = [];

  for (let index = 0; index < fetchPromises.length; index++) {
    booksBuffers.push(await fetchPromises[index]);
  }
  let bookNames = books.map((item) => {
    return item.name + `.${item.format.toLocaleLowerCase()}`;
  });

  saveAs(
    await zipFilesToBlob(booksBuffers, bookNames),
    "KoodoReader-Book-" +
      `${year}-${month <= 9 ? "0" + month : month}-${
        day <= 9 ? "0" + day : day
      }.zip`
  );
};

export const exportNotes = (notes: Note[], books: Book[]) => {
  let data = notes.map((item) => {
    let book = books.filter((subitem) => subitem.key === item.bookKey)[0];
    let bookName = book ? book.name : "Unknown book";
    let bookAuthor = book ? book.author : "Unknown author";
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
      bookName: bookName,
      bookAuthor: bookAuthor,
    };
  });
  saveAs(
    new Blob([convertArrayToCSV(data)], { type: "text/csv,charset=UTF-8" }),
    "KoodoReader-Note-" +
      `${year}-${month <= 9 ? "0" + month : month}-${
        day <= 9 ? "0" + day : day
      }.csv`
  );
};

export const exportHighlights = (highlights: Note[], books: Book[]) => {
  let data = highlights.map((item) => {
    let book = books.filter((subitem) => subitem.key === item.bookKey)[0];
    let bookName = book ? book.name : "Unknown book";
    let bookAuthor = book ? book.author : "Unknown author";
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
      bookName: bookName,
      bookAuthor: bookAuthor,
    };
    const { notes, ...rest } = highlight;
    return rest;
  });
  saveAs(
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
    let book = books.filter((subitem) => subitem.key === item.bookKey)[0];
    let bookName = book ? book.name : "Unknown book";
    let bookAuthor = book ? book.author : "Unknown author";
    let history = {
      ...item,
      date: `${item.date.year}-${
        item.date.month <= 9 ? "0" + item.date.month : item.date.month
      }-${item.date.day <= 9 ? "0" + item.date.day : item.date.day}`,
      bookName: bookName,
      bookAuthor: bookAuthor,
    };
    return history;
  });

  saveAs(
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
            return '"' + cell.replace(/"/g, '""') + '"';
          } else {
            return cell;
          }
        })
        .join(",") + "\n";
  });
  return csvContent;
};
