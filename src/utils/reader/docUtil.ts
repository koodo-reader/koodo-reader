import Book from "../../models/Book";
import { isPaginatedBook } from "../common";

export const getOuterDoc = () => {
  let pageArea = document.getElementById("page-area");

  if (!pageArea) return null;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe) return null;
  return iframe.contentDocument;
};

export const getIframeDoc = (book: Book) => {
  let doc = getOuterDoc();
  if (!doc) return [];
  if (isPaginatedBook(book)) {
    let subIframes = doc.querySelectorAll("iframe");
    return [
      doc,
      ...Array.from(subIframes).map((subIframe) => {
        let subDoc = subIframe.contentDocument;
        return subDoc;
      }),
    ];
  } else {
    return [doc];
  }
};
export const getIframeWin = () => {
  let pageArea = document.getElementById("page-area");
  if (!pageArea) return null;
  let iframe = pageArea.getElementsByTagName("iframe")[0];
  if (!iframe) return null;
  return iframe;
};
