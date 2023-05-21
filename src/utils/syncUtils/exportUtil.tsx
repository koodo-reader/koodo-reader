import FileSaver from "file-saver";
import BookModel from "../../model/Book";
import NoteModel from "../../model/Note";
import BookUtil from "../fileUtils/bookUtil";
import { zipFilesToBlob } from "./common";
declare var window: any;
let year = new Date().getFullYear(),
  month = new Date().getMonth() + 1,
  day = new Date().getDate();
export const exportBooks = async (books: BookModel[]) => {
  let fetchPromises = BookUtil.FetchAllBooks(books);
  let booksBuffers: any[] = [];

  for (let index = 0; index < fetchPromises.length; index++) {
    booksBuffers.push(await fetchPromises[index]);
  }
  let bookNames = books.map((item) => {
    return item.name + `.${item.format.toLocaleLowerCase()}`;
  });

  FileSaver.saveAs(
    await zipFilesToBlob(booksBuffers, bookNames),
    "KoodoReader-Book-" +
      `${year}-${month <= 9 ? "0" + month : month}-${
        day <= 9 ? "0" + day : day
      }.zip`
  );
};

export const exportNotes = (notes: NoteModel[], books: BookModel[]) => {
  var wb = window.XLSX.utils.book_new();
  var ws = window.XLSX.utils.json_to_sheet(
    notes.map((item) => {
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
        bookName: books.filter((subitem) => subitem.key === item.bookKey)[0]
          .name,
        bookAuthor: books.filter((subitem) => subitem.key === item.bookKey)[0]
          .author,
      };
    })
  );
  window.XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  window.XLSX.writeFile(
    wb,
    "KoodoReader-Note-" +
      `${year}-${month <= 9 ? "0" + month : month}-${
        day <= 9 ? "0" + day : day
      }.xlsx`
  );
};

export const exportHighlights = (
  highlights: NoteModel[],
  books: BookModel[]
) => {
  var wb = window.XLSX.utils.book_new();
  var ws = window.XLSX.utils.json_to_sheet(
    highlights.map((item) => {
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
        bookName: books.filter((subitem) => subitem.key === item.bookKey)[0]
          .name,
        bookAuthor: books.filter((subitem) => subitem.key === item.bookKey)[0]
          .author,
      };
      const { notes, ...rest } = highlight;
      return rest;
    })
  );
  window.XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  window.XLSX.writeFile(
    wb,
    "KoodoReader-Highlight-" +
      `${year}-${month <= 9 ? "0" + month : month}-${
        day <= 9 ? "0" + day : day
      }.xlsx`
  );
};
