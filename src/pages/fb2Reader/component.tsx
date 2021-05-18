//卡片模式下的图书显示
import React from "react";
import RecentBooks from "../../utils/readUtils/recordRecent";
import { ViewerProps, ViewerState } from "./interface";
import localforage from "localforage";
import { withRouter } from "react-router-dom";
import _ from "underscore";
import BookUtil from "../../utils/bookUtil";
import xml2js from "xml2js";
import "./viewer.css";
import OtherUtil from "../../utils/otherUtil";
import iconv from "iconv-lite";
import chardet from "chardet";

declare var window: any;

class Viewer extends React.Component<ViewerProps, ViewerState> {
  epub: any;
  constructor(props: ViewerProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    let url = document.location.href.split("/");
    let key = url[url.length - 1].split("?")[0];

    localforage.getItem("books").then((result: any) => {
      let book = result[_.findIndex(result, { key })];
      BookUtil.fetchBook(key, true).then((result) => {
        this.props.handleReadingBook(book);

        this.handleFb2(result as ArrayBuffer);

        this.props.handleReadingState(true);
        RecentBooks.setRecent(key);
      });
    });
    document
      .querySelectorAll('style,link[rel="stylesheet"]')
      .forEach((item) => item.remove());
    window.onbeforeunload = () => {
      this.handleExit();
    };
  }
  // 点击退出按钮的处理程序
  handleExit() {
    this.props.handleReadingState(false);

    OtherUtil.setReaderConfig("windowWidth", document.body.clientWidth + "");
    OtherUtil.setReaderConfig("windowHeight", document.body.clientHeight + "");
    OtherUtil.setReaderConfig("windowX", window.screenX + "");
    OtherUtil.setReaderConfig("windowY", window.screenY + "");
  }
  handleFb2 = (result: ArrayBuffer) => {
    let fb2Str = iconv.decode(
      Buffer.from(result),
      chardet.detect(Buffer.from(result)) as string
    );
    let bookObj = this.xmlBookToObj(Buffer.from(result));
    bookObj += this.xmlBookTagFilter(fb2Str);
    console.log(bookObj, "bookboj");
    let viewer: HTMLElement | null = document.querySelector(".ebook-viewer");
    if (!viewer?.innerHTML) return;
    viewer.innerHTML = bookObj;
  };
  xmlBookToObj = (xml) => {
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

  xmlBookTagFilter = (bookString) => {
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
  render() {
    return <div className="ebook-viewer">Loading</div>;
  }
}
export default withRouter(Viewer as any);
