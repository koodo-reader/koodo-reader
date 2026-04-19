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
export const exportNotes = async (
  notes: Note[],
  books: Book[],
  format: "csv" | "md" | "txt" | "html" | "pdf" = "csv"
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
  } else if (format === "html") {
    saveAs(
      new Blob([convertNotesToHTML(data)], { type: "text/html,charset=UTF-8" }),
      `KoodoReader-Note-${fileDate}.html`
    );
  } else if (format === "pdf") {
    await exportHTMLAsPDF(
      convertNotesToHTML(data),
      `KoodoReader-Note-${fileDate}.pdf`
    );
  } else {
    saveAs(
      new Blob([convertArrayToCSV(data)], { type: "text/csv,charset=UTF-8" }),
      `KoodoReader-Note-${fileDate}.csv`
    );
  }
};

export const exportHighlights = async (
  highlights: Note[],
  books: Book[],
  format: "csv" | "md" | "txt" | "html" | "pdf" = "csv"
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
  } else if (format === "html") {
    saveAs(
      new Blob([convertHighlightsToHTML(data)], {
        type: "text/html,charset=UTF-8",
      }),
      `KoodoReader-Highlight-${fileDate}.html`
    );
  } else if (format === "pdf") {
    await exportHTMLAsPDF(
      convertHighlightsToHTML(data),
      `KoodoReader-Highlight-${fileDate}.pdf`
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
      sentence: item.sentence || "",
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

const buildHTMLTemplate = (title: string, bodyContent: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 860px; margin: 40px auto; padding: 0 20px; color: #222; line-height: 1.7; }
    h1 { font-size: 1.8em; border-bottom: 2px solid #444; padding-bottom: 8px; }
    h2 { font-size: 1.4em; margin-top: 2em; color: #333; }
    h3 { font-size: 1.1em; color: #555; margin-top: 1.2em; }
    blockquote { border-left: 4px solid #aaa; margin: 0.8em 0 0.8em 0; padding: 6px 16px; background: #f9f9f9; color: #444; }
    .note { background: #fffbe6; border-left: 4px solid #f5c518; padding: 6px 14px; margin: 6px 0; }
    .meta { font-size: 0.85em; color: #888; margin: 4px 0 10px; }
    hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
};

export const convertNotesToHTML = (notes: any[]): string => {
  const bookMap: { [key: string]: any[] } = {};
  notes.forEach((note) => {
    const key = note.bookName || "Unknown book";
    if (!bookMap[key]) bookMap[key] = [];
    bookMap[key].push(note);
  });

  let body = `<h1>Koodo Reader - Notes</h1>\n`;
  Object.entries(bookMap).forEach(([bookName, bookNotes]) => {
    const author = bookNotes[0].bookAuthor || "Unknown author";
    body += `<h2>${escapeHTML(bookName)}</h2>\n<p><em>${escapeHTML(author)}</em></p>\n`;
    bookNotes.forEach((note) => {
      if (note.chapter) {
        body += `<h3>${escapeHTML(note.chapter)}</h3>\n`;
      }
      if (note.text) {
        body += `<blockquote>${escapeHTML(note.text)}</blockquote>\n`;
      }
      if (note.notes) {
        body += `<div class="note"><strong>Note:</strong> ${escapeHTML(note.notes)}</div>\n`;
      }
      const meta: string[] = [];
      if (note.date) meta.push(`Date: ${note.date}`);
      if (note.color) meta.push(`Color: ${note.color}`);
      if (note.tag) meta.push(`Tags: ${note.tag}`);
      if (meta.length > 0) {
        body += `<p class="meta">${meta.join(" &nbsp;|&nbsp; ")}</p>\n`;
      }
      body += `<hr />\n`;
    });
  });
  return buildHTMLTemplate("Koodo Reader - Notes", body);
};

export const convertHighlightsToHTML = (highlights: any[]): string => {
  const bookMap: { [key: string]: any[] } = {};
  highlights.forEach((highlight) => {
    const key = highlight.bookName || "Unknown book";
    if (!bookMap[key]) bookMap[key] = [];
    bookMap[key].push(highlight);
  });

  let body = `<h1>Koodo Reader - Highlights</h1>\n`;
  Object.entries(bookMap).forEach(([bookName, bookHighlights]) => {
    const author = bookHighlights[0].bookAuthor || "Unknown author";
    body += `<h2>${escapeHTML(bookName)}</h2>\n<p><em>${escapeHTML(author)}</em></p>\n`;
    bookHighlights.forEach((highlight) => {
      if (highlight.chapter) {
        body += `<h3>${escapeHTML(highlight.chapter)}</h3>\n`;
      }
      if (highlight.text) {
        body += `<blockquote>${escapeHTML(highlight.text)}</blockquote>\n`;
      }
      const meta: string[] = [];
      if (highlight.date) meta.push(`Date: ${highlight.date}`);
      if (highlight.color) meta.push(`Color: ${highlight.color}`);
      if (highlight.highlightType)
        meta.push(`Type: ${highlight.highlightType}`);
      if (highlight.tag) meta.push(`Tags: ${highlight.tag}`);
      if (meta.length > 0) {
        body += `<p class="meta">${meta.join(" &nbsp;|&nbsp; ")}</p>\n`;
      }
      body += `<hr />\n`;
    });
  });
  return buildHTMLTemplate("Koodo Reader - Highlights", body);
};

const escapeHTML = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br />");
};

export const exportHTMLAsPDF = async (
  htmlContent: string,
  fileName: string
): Promise<void> => {
  const jsPDFLib = (window as any).jspdf;
  const html2canvas = (window as any).html2canvas;

  if (!jsPDFLib || !jsPDFLib.jsPDF || !html2canvas) {
    // Fallback: save as HTML if libraries are not loaded
    saveAs(
      new Blob([htmlContent], { type: "text/html,charset=UTF-8" }),
      fileName.replace(/\.pdf$/, ".html")
    );
    return;
  }

  // Create a hidden off-screen container to render the HTML
  const container = document.createElement("div");
  container.style.cssText = [
    "position:fixed",
    "left:-9999px",
    "top:0",
    "width:860px",
    "background:#fff",
    "padding:40px",
    "box-sizing:border-box",
    "font-family:Georgia,serif",
    "color:#222",
    "line-height:1.7",
  ].join(";");
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const { jsPDF } = jsPDFLib;
    const a4WidthMm = 210;
    const a4HeightMm = 297;
    const margin = 10; // mm

    // Render the full container to a canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: 860 + 80, // container width + padding*2
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const imgWidthMm = a4WidthMm - margin * 2;
    // Calculate the total height in mm proportionally
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageContentHeight = a4HeightMm - margin * 2;
    let remainingHeight = imgHeightMm;
    let sourceY = 0; // current top position in the image (in mm)

    while (remainingHeight > 0) {
      const sliceHeight = Math.min(remainingHeight, pageContentHeight);

      // Convert mm back to pixels for the source slice
      const srcYpx = (sourceY / imgHeightMm) * canvas.height;
      const srcHpx = (sliceHeight / imgHeightMm) * canvas.height;

      // Create a temporary canvas for this page slice
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.round(srcHpx);
      const ctx = pageCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(
          canvas,
          0,
          Math.round(srcYpx),
          canvas.width,
          Math.round(srcHpx),
          0,
          0,
          canvas.width,
          Math.round(srcHpx)
        );
      }
      const sliceData = pageCanvas.toDataURL("image/jpeg", 0.92);
      doc.addImage(sliceData, "JPEG", margin, margin, imgWidthMm, sliceHeight);

      remainingHeight -= sliceHeight;
      sourceY += sliceHeight;
      if (remainingHeight > 0) {
        doc.addPage();
      }
    }

    doc.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
};
