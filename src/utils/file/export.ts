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
// 将内容字符串转为 Blob
const toBlob = (content: string, format: string): Blob => {
  const mimeMap: Record<string, string> = {
    md: "text/markdown,charset=UTF-8",
    txt: "text/plain,charset=UTF-8",
    html: "text/html,charset=UTF-8",
    csv: "text/csv,charset=UTF-8",
  };
  return new Blob([content], { type: mimeMap[format] || "text/plain" });
};

// 按书名分组数据，返回 { bookName -> items[] } 映射
const groupByBook = (data: any[]): Record<string, any[]> => {
  const map: Record<string, any[]> = {};
  data.forEach((item) => {
    const key = item.bookName || "Unknown book";
    if (!map[key]) map[key] = [];
    map[key].push(item);
  });
  return map;
};

// 将文件名中不合法的字符替换为下划线
const sanitizeFileName = (name: string): string =>
  name.replace(/[\\/:*?"<>|]/g, "_");

// 根据 format 将 data 转为文本内容
const convertNotesData = (
  data: any[],
  format: "csv" | "md" | "txt" | "html"
): string => {
  if (format === "md") return convertNotesToMarkdown(data);
  if (format === "txt") return convertNotesToTxt(data);
  if (format === "html") return convertNotesToHTML(data);
  return convertArrayToCSV(data);
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

  // 涉及多本书时导出压缩包
  const bookNames = Object.keys(groupByBook(data));
  if (bookNames.length > 1 && format !== "pdf") {
    const zip = new JSZip();
    // 全量文件
    zip.file(`all.${format}`, convertNotesData(data, format));
    // 每本书单独文件
    const bookMap = groupByBook(data);
    Object.entries(bookMap).forEach(([bookName, bookData]) => {
      zip.file(
        `${sanitizeFileName(bookName)}.${format}`,
        convertNotesData(bookData, format)
      );
    });
    saveAs(
      await zip.generateAsync({ type: "blob" }),
      `KoodoReader-Note-${fileDate}.zip`
    );
    return;
  }

  if (bookNames.length > 1 && format === "pdf") {
    const zip = new JSZip();
    // 全量 PDF
    const allPdfBlob = await generateHTMLAsPDFBlob(convertNotesToHTML(data));
    zip.file("all.pdf", allPdfBlob);
    // 每本书单独 PDF
    const bookMap = groupByBook(data);
    for (const [bookName, bookData] of Object.entries(bookMap)) {
      const blob = await generateHTMLAsPDFBlob(convertNotesToHTML(bookData));
      zip.file(`${sanitizeFileName(bookName)}.pdf`, blob);
    }
    saveAs(
      await zip.generateAsync({ type: "blob" }),
      `KoodoReader-Note-${fileDate}.zip`
    );
    return;
  }

  if (format === "md") {
    saveAs(
      toBlob(convertNotesToMarkdown(data), "md"),
      `KoodoReader-Note-${fileDate}.md`
    );
  } else if (format === "txt") {
    saveAs(
      toBlob(convertNotesToTxt(data), "txt"),
      `KoodoReader-Note-${fileDate}.txt`
    );
  } else if (format === "html") {
    saveAs(
      toBlob(convertNotesToHTML(data), "html"),
      `KoodoReader-Note-${fileDate}.html`
    );
  } else if (format === "pdf") {
    await exportHTMLAsPDF(
      convertNotesToHTML(data),
      `KoodoReader-Note-${fileDate}.pdf`
    );
  } else {
    saveAs(
      toBlob(convertArrayToCSV(data), "csv"),
      `KoodoReader-Note-${fileDate}.csv`
    );
  }
};

// 根据 format 将 data 转为文本内容
const convertHighlightsData = (
  data: any[],
  format: "csv" | "md" | "txt" | "html"
): string => {
  if (format === "md") return convertHighlightsToMarkdown(data);
  if (format === "txt") return convertHighlightsToTxt(data);
  if (format === "html") return convertHighlightsToHTML(data);
  return convertArrayToCSV(data);
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

  // 涉及多本书时导出压缩包
  const bookNames = Object.keys(groupByBook(data));
  if (bookNames.length > 1 && format !== "pdf") {
    const zip = new JSZip();
    zip.file(`all.${format}`, convertHighlightsData(data, format));
    const bookMap = groupByBook(data);
    Object.entries(bookMap).forEach(([bookName, bookData]) => {
      zip.file(
        `${sanitizeFileName(bookName)}.${format}`,
        convertHighlightsData(bookData, format)
      );
    });
    saveAs(
      await zip.generateAsync({ type: "blob" }),
      `KoodoReader-Highlight-${fileDate}.zip`
    );
    return;
  }

  if (bookNames.length > 1 && format === "pdf") {
    const zip = new JSZip();
    const allPdfBlob = await generateHTMLAsPDFBlob(
      convertHighlightsToHTML(data)
    );
    zip.file("all.pdf", allPdfBlob);
    const bookMap = groupByBook(data);
    for (const [bookName, bookData] of Object.entries(bookMap)) {
      const blob = await generateHTMLAsPDFBlob(
        convertHighlightsToHTML(bookData)
      );
      zip.file(`${sanitizeFileName(bookName)}.pdf`, blob);
    }
    saveAs(
      await zip.generateAsync({ type: "blob" }),
      `KoodoReader-Highlight-${fileDate}.zip`
    );
    return;
  }

  if (format === "md") {
    saveAs(
      toBlob(convertHighlightsToMarkdown(data), "md"),
      `KoodoReader-Highlight-${fileDate}.md`
    );
  } else if (format === "txt") {
    saveAs(
      toBlob(convertHighlightsToTxt(data), "txt"),
      `KoodoReader-Highlight-${fileDate}.txt`
    );
  } else if (format === "html") {
    saveAs(
      toBlob(convertHighlightsToHTML(data), "html"),
      `KoodoReader-Highlight-${fileDate}.html`
    );
  } else if (format === "pdf") {
    await exportHTMLAsPDF(
      convertHighlightsToHTML(data),
      `KoodoReader-Highlight-${fileDate}.pdf`
    );
  } else {
    saveAs(
      toBlob(convertArrayToCSV(data), "csv"),
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

const preparePDFExportFrame = async (
  htmlContent: string
): Promise<HTMLIFrameElement> => {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    "width:940px",
    "height:1px",
    "border:0",
    "opacity:0",
    "pointer-events:none",
    "background:#fff",
  ].join(";");
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument;
  const iframeWin = iframe.contentWindow;

  if (!iframeDoc || !iframeWin) {
    document.body.removeChild(iframe);
    throw new Error("Failed to create PDF export frame");
  }

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  if (iframeDoc.fonts?.ready) {
    await iframeDoc.fonts.ready;
  }

  await new Promise<void>((resolve) => {
    iframeWin.requestAnimationFrame(() => resolve());
  });

  const frameHeight = Math.max(
    iframeDoc.documentElement.scrollHeight,
    iframeDoc.body.scrollHeight
  );
  iframe.style.height = `${Math.max(frameHeight, 1)}px`;

  return iframe;
};

// 将 HTML 内容渲染为 PDF 并返回 Blob；库不可用时 fallback 为 HTML Blob
const generateHTMLAsPDFBlob = async (htmlContent: string): Promise<Blob> => {
  const jsPDFLib = (window as any).jspdf;
  const html2canvas = (window as any).html2canvas;

  if (!jsPDFLib || !jsPDFLib.jsPDF || !html2canvas) {
    return new Blob([htmlContent], { type: "text/html,charset=UTF-8" });
  }

  const iframe = await preparePDFExportFrame(htmlContent);
  const iframeDoc = iframe.contentDocument;

  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("Failed to access PDF export frame");
  }

  try {
    const { jsPDF } = jsPDFLib;
    const a4WidthMm = 210;
    const a4HeightMm = 297;
    const margin = 10;

    const captureTarget = iframeDoc.body;
    const captureWidth = Math.max(
      iframeDoc.documentElement.scrollWidth,
      captureTarget.scrollWidth,
      940
    );
    const captureHeight = Math.max(
      iframeDoc.documentElement.scrollHeight,
      captureTarget.scrollHeight
    );

    const canvas = await html2canvas(captureTarget, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: captureWidth,
      windowHeight: captureHeight,
    });

    const imgWidthMm = a4WidthMm - margin * 2;
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageContentHeight = a4HeightMm - margin * 2;
    let remainingHeight = imgHeightMm;
    let sourceY = 0;

    while (remainingHeight > 0) {
      const sliceHeight = Math.min(remainingHeight, pageContentHeight);
      const srcYpx = (sourceY / imgHeightMm) * canvas.height;
      const srcHpx = (sliceHeight / imgHeightMm) * canvas.height;

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
      doc.addImage(
        pageCanvas.toDataURL("image/jpeg", 0.92),
        "JPEG",
        margin,
        margin,
        imgWidthMm,
        sliceHeight
      );

      remainingHeight -= sliceHeight;
      sourceY += sliceHeight;
      if (remainingHeight > 0) doc.addPage();
    }

    return doc.output("blob");
  } finally {
    document.body.removeChild(iframe);
  }
};

export const exportHTMLAsPDF = async (
  htmlContent: string,
  fileName: string
): Promise<void> => {
  const blob = await generateHTMLAsPDFBlob(htmlContent);
  // generateHTMLAsPDFBlob fallback 时返回 HTML Blob，调整文件名后缀
  const isHTML = blob.type.startsWith("text/html");
  saveAs(blob, isHTML ? fileName.replace(/\.pdf$/, ".html") : fileName);
};
