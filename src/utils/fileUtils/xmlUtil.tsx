import xml2js from "xml2js";
import { isTitle } from "./titleUtil";
export const xmlBookToObj = (xml) => {
  var objBook: any = {};
  var informBook;
  let parser = new xml2js.Parser();
  parser.parseString(xml, function (err, result) {
    if (err) {
      console.log("Error with parsing xml" + err);
    }

    var fictionBook = result.FictionBook;
    var bookDesc = fictionBook.description[0]["title-info"][0];

    objBook.title = bookDesc["book-title"][0];
    informBook = "<h2>" + objBook.title + "</h2>";

    if (bookDesc["author"][0]["first-name"]) {
      objBook.firstName = bookDesc["author"][0]["first-name"][0];
      informBook += "<h3>" + objBook.firstName;
      if (bookDesc["author"][0]["last-name"]) {
        objBook.lastName = bookDesc["author"][0]["last-name"][0];
        informBook += " " + objBook.lastName;
      }
      informBook += "</h3>";
    }

    if (fictionBook.binary) {
      objBook.posterSrc =
        "data:image/jpeg;base64," + fictionBook.binary[0]["_"];
      informBook += '<img alt="poster" src="' + objBook.posterSrc + '">';
    }
  });

  return informBook;
};

export const xmlBookTagFilter = (bookString) => {
  var regExpTagDelete = /<epigraph>|<\/epigraph>|<empty-line\/>|/gi;
  var regExpTitleOpen = /<title>/gi;
  var regExpTitleClose = /<\/title>/gi;
  var bookStart = bookString.match(/<body.*?>/i);
  var bookBody = bookString.slice(
    bookString.search(/<body.*?>/i) + bookStart[0].length,
    bookString.search(/<\/body>/i)
  );

  bookBody = bookBody.replace(regExpTagDelete, "");
  bookBody = bookBody.replace(regExpTitleOpen, "<h3>");
  bookBody = bookBody.replace(regExpTitleClose, "</h3>");

  return bookBody;
};
export const txtToHtml = (
  lines: string[],
  content: string[],
  chapter: string = ""
) => {
  let html: string = "";
  let isStartWithKeyword = false;
  let _chapter = chapter.replace(/(\r\n|\n|\r)/gm, "");
  let _lines = lines.map((item) => item.replace(/(\r\n|\n|\r)/gm, ""));
  let startIndex = _lines.indexOf(_chapter) > -1 ? _lines.indexOf(_chapter) : 0;
  if (lines.length > 50000) {
    for (
      let i = startIndex > 25000 ? startIndex - 25000 : 0;
      i <
      (startIndex < lines.length - 25000
        ? startIndex > 25000
          ? startIndex + 25000
          : 50000
        : lines.length);
      i++
    ) {
      if (lines[i].trim()) {
        if (
          content.indexOf(lines[i]) > -1 ||
          isTitle(lines[i].trim(), isStartWithKeyword)
        ) {
          //只要出现以第，chapter，CHAPTER开头的章节，就不再检测不以这些字开头的段落
          if (
            lines[i].trim().startsWith("第") ||
            lines[i].trim().startsWith("Chapter") ||
            lines[i].trim().startsWith("CHAPTER")
          ) {
            isStartWithKeyword = true;
          }

          html += `<h1>${lines[i]}</h1>`;
        } else {
          html += `<p>${lines[i]}</p>`;
        }
      }
    }
  } else {
    for (let item of lines) {
      if (item.trim()) {
        if (
          content.indexOf(item) > -1 ||
          isTitle(item.trim(), isStartWithKeyword)
        ) {
          //只要出现以第，chapter，CHAPTER开头的章节，就不再检测不以这些字开头的段落
          if (
            item.trim().startsWith("第") ||
            item.trim().startsWith("Chapter") ||
            item.trim().startsWith("CHAPTER")
          ) {
            isStartWithKeyword = true;
          }

          html += `<h1>${item}</h1>`;
        } else {
          html += `<p>${item}</p>`;
        }
      }
    }
  }

  return html;
};
