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
export const exportNotes = (
  notes: Note[],
  books: Book[],
  format: "csv" | "md" | "txt" = "csv"
) => {
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
  const fileDate = `${year}-${month <= 9 ? "0" + month : month}-${
    day <= 9 ? "0" + day : day
  }`;
  if (format === "md") {
    saveAs(
      new Blob([convertNotesToMarkdown(data)], {
        type: "text/markdown,charset=UTF-8",
      }),
      `KoodoReader-Note-${fileDate}.md`
    );
  } else if (format === "txt") {
    saveAs(
      new Blob([convertNotesToTxt(data)], { type: "text/plain,charset=UTF-8" }),
      `KoodoReader-Note-${fileDate}.txt`
    );
  } else {
    saveAs(
      new Blob([convertArrayToCSV(data)], { type: "text/csv,charset=UTF-8" }),
      `KoodoReader-Note-${fileDate}.csv`
    );
  }
};

export const exportHighlights = (
  highlights: Note[],
  books: Book[],
  format: "csv" | "md" | "txt" = "csv"
) => {
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
  const fileDate = `${year}-${month <= 9 ? "0" + month : month}-${
    day <= 9 ? "0" + day : day
  }`;
  if (format === "md") {
    saveAs(
      new Blob([convertHighlightsToMarkdown(data)], {
        type: "text/markdown,charset=UTF-8",
      }),
      `KoodoReader-Highlight-${fileDate}.md`
    );
  } else if (format === "txt") {
    saveAs(
      new Blob([convertHighlightsToTxt(data)], {
        type: "text/plain,charset=UTF-8",
      }),
      `KoodoReader-Highlight-${fileDate}.txt`
    );
  } else {
    saveAs(
      new Blob([convertArrayToCSV(data)], { type: "text/csv,charset=UTF-8" }),
      `KoodoReader-Highlight-${fileDate}.csv`
    );
  }
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

export const convertNotesToMarkdown = (notes: any[]) => {
  // Group notes by book
  const bookMap: { [key: string]: any[] } = {};
  notes.forEach((note) => {
    const key = note.bookName || "Unknown book";
    if (!bookMap[key]) bookMap[key] = [];
    bookMap[key].push(note);
  });

  let md = `# Koodo Reader - Notes\n\n`;
  Object.entries(bookMap).forEach(([bookName, bookNotes]) => {
    const author = bookNotes[0].bookAuthor || "Unknown author";
    md += `## ${bookName}\n\n`;
    md += `*${author}*\n\n`;
    bookNotes.forEach((note) => {
      if (note.chapter) {
        md += `### ${note.chapter}\n\n`;
      }
      if (note.text) {
        md += `> ${note.text.replace(/\n/g, "\n> ")}\n\n`;
      }
      if (note.notes) {
        md += `**Note:** ${note.notes}\n\n`;
      }
      const meta: string[] = [];
      if (note.date) meta.push(`Date: ${note.date}`);
      if (note.color) meta.push(`Color: ${note.color}`);
      if (note.tag) meta.push(`Tags: ${note.tag}`);
      if (meta.length > 0) {
        md += `*${meta.join(" | ")}*\n\n`;
      }
      md += `---\n\n`;
    });
  });
  return md;
};

export const convertNotesToTxt = (notes: any[]) => {
  // Group notes by book
  const bookMap: { [key: string]: any[] } = {};
  notes.forEach((note) => {
    const key = note.bookName || "Unknown book";
    if (!bookMap[key]) bookMap[key] = [];
    bookMap[key].push(note);
  });

  let txt = `Koodo Reader - Notes\n${"=".repeat(40)}\n\n`;
  Object.entries(bookMap).forEach(([bookName, bookNotes]) => {
    const author = bookNotes[0].bookAuthor || "Unknown author";
    txt += `Book: ${bookName}\n`;
    txt += `Author: ${author}\n`;
    txt += `${"-".repeat(40)}\n\n`;
    bookNotes.forEach((note) => {
      if (note.chapter) {
        txt += `Chapter: ${note.chapter}\n`;
      }
      if (note.text) {
        txt += `Text: ${note.text}\n`;
      }
      if (note.notes) {
        txt += `Note: ${note.notes}\n`;
      }
      if (note.date) txt += `Date: ${note.date}\n`;
      if (note.color) txt += `Color: ${note.color}\n`;
      if (note.tag) txt += `Tags: ${note.tag}\n`;
      txt += `\n`;
    });
    txt += `\n`;
  });
  return txt;
};

export const convertHighlightsToMarkdown = (highlights: any[]) => {
  // Group highlights by book
  const bookMap: { [key: string]: any[] } = {};
  highlights.forEach((highlight) => {
    const key = highlight.bookName || "Unknown book";
    if (!bookMap[key]) bookMap[key] = [];
    bookMap[key].push(highlight);
  });

  let md = `# Koodo Reader - Highlights\n\n`;
  Object.entries(bookMap).forEach(([bookName, bookHighlights]) => {
    const author = bookHighlights[0].bookAuthor || "Unknown author";
    md += `## ${bookName}\n\n`;
    md += `*${author}*\n\n`;
    bookHighlights.forEach((highlight) => {
      if (highlight.chapter) {
        md += `### ${highlight.chapter}\n\n`;
      }
      if (highlight.text) {
        md += `> ${highlight.text.replace(/\n/g, "\n> ")}\n\n`;
      }
      const meta: string[] = [];
      if (highlight.date) meta.push(`Date: ${highlight.date}`);
      if (highlight.color) meta.push(`Color: ${highlight.color}`);
      if (highlight.highlightType)
        meta.push(`Type: ${highlight.highlightType}`);
      if (highlight.tag) meta.push(`Tags: ${highlight.tag}`);
      if (meta.length > 0) {
        md += `*${meta.join(" | ")}*\n\n`;
      }
      md += `---\n\n`;
    });
  });
  return md;
};

export const convertHighlightsToTxt = (highlights: any[]) => {
  // Group highlights by book
  const bookMap: { [key: string]: any[] } = {};
  highlights.forEach((highlight) => {
    const key = highlight.bookName || "Unknown book";
    if (!bookMap[key]) bookMap[key] = [];
    bookMap[key].push(highlight);
  });

  let txt = `Koodo Reader - Highlights\n${"=".repeat(40)}\n\n`;
  Object.entries(bookMap).forEach(([bookName, bookHighlights]) => {
    const author = bookHighlights[0].bookAuthor || "Unknown author";
    txt += `Book: ${bookName}\n`;
    txt += `Author: ${author}\n`;
    txt += `${"-".repeat(40)}\n\n`;
    bookHighlights.forEach((highlight) => {
      if (highlight.chapter) {
        txt += `Chapter: ${highlight.chapter}\n`;
      }
      if (highlight.text) {
        txt += `Text: ${highlight.text}\n`;
      }
      if (highlight.date) txt += `Date: ${highlight.date}\n`;
      if (highlight.color) txt += `Color: ${highlight.color}\n`;
      if (highlight.highlightType) txt += `Type: ${highlight.highlightType}\n`;
      if (highlight.tag) txt += `Tags: ${highlight.tag}\n`;
      txt += `\n`;
    });
    txt += `\n`;
  });
  return txt;
};
