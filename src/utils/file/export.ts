import Book from "../../models/Book";
import DictHistory from "../../models/DictHistory";
import Note from "../../models/Note";
import BookUtil from "./bookUtil";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import i18n from "../../i18n";
import toast from "react-hot-toast";
export const zipFilesToBlob = (buffers: ArrayBuffer[], names: string[]) => {
  var zip = new JSZip();
  for (let index = 0; index < buffers.length; index++) {
    zip.file(names[index], buffers[index]);
  }
  return zip.generateAsync({ type: "blob" });
};

let year = new Date().getFullYear(),
  month = new Date().getMonth() + 1,
  day = new Date().getDate();

export const exportBooks = async (books: Book[]) => {
  if (isElectron && books.length > 50) {
    const { ipcRenderer } = window.require("electron");
    const fs = window.require("fs");
    const path = window.require("path");
    const exportPath = await ipcRenderer.invoke("select-path");
    if (!exportPath) {
      toast.error(i18n.t("Please select a folder"));
      return false;
    }
    toast.loading(i18n.t("Exporting..."), {
      id: "exporting",
    });

    // 让 UI 有时间渲染 toast
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 逐个获取并写入图书文件
    for (let i = 0; i < books.length; i++) {
      try {
        const book = books[i];
        const bookBuffer: boolean | ArrayBuffer | File =
          await BookUtil.fetchBook(
            book.key,
            book.format.toLowerCase(),
            true,
            book.path
          );

        if (bookBuffer) {
          const fileName = getBookName(book);
          const filePath = path.join(exportPath, fileName);
          // 使用 Promise 包装 writeFile 避免阻塞 UI
          await new Promise((resolve, reject) => {
            fs.writeFile(
              filePath,
              Buffer.from(bookBuffer as ArrayBuffer),
              (err) => {
                if (err) reject(err);
                else resolve(null);
              }
            );
          });
        }
      } catch (error) {
        console.error(`Failed to export book ${books[i].name}:`, error);
        toast.error(i18n.t("Failed to export") + `: ${books[i].name}`);
      }
    }
    toast.success(i18n.t("Export successful"), {
      id: "exporting",
    });
    return true;
  }
  let fetchPromises = BookUtil.fetchAllBooks(books);
  let booksBuffers: any[] = [];

  for (let index = 0; index < fetchPromises.length; index++) {
    booksBuffers.push(await fetchPromises[index]);
  }
  let bookNames = books.map((item) => {
    return getBookName(item);
  });

  saveAs(
    await zipFilesToBlob(booksBuffers, bookNames),
    "KoodoReader-Book-" +
      `${year}-${month <= 9 ? "0" + month : month}-${
        day <= 9 ? "0" + day : day
      }.zip`
  );
};
export const getBookName = (item: Book) => {
  if (ConfigService.getReaderConfig("isExportOriginalName") === "yes") {
    let filename =
      item.path.replace(/\\/g, "/").split("/").pop() ||
      item.name + `.${item.format.toLowerCase()}`;
    return filename;
  }
  return item.name + `.${item.format.toLocaleLowerCase()}`;
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
