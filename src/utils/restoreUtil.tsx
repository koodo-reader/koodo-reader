import JSZip from "jszip";
import localforage from "localforage";
import BookModel from "../model/Book";

class RestoreUtil {
  importBooks = (books: BookModel[], file: any, handleFinish: () => void) => {
    let zip = new JSZip();
    books.forEach((item, index) => {
      zip
        .loadAsync(file)
        .then((content) => {
          // you now have every files contained in the loaded zip
          return content.files[`epub/${item.name}.epub`].async("arraybuffer"); // a promise of "Hello World\n"
        })
        .then((book) => {
          item.content = book;
        })
        .then(() => {
          if (index === books.length - 1) {
            localforage.setItem("books", books).then(() => {
              handleFinish();
            });
          }
        })
        .catch(() => {
          console.log("Error occurs");
        });
    });
  };
  static restore = (file: any, handleFinish: () => void) => {
    let dataArr = [
      "notes",
      "books",
      "bookmarks",
      "readerConfig",
      "sortCode",
      "readingTime",
      "recentBooks",
      "shelfList",
      "recordLocation",
    ];
    let zip = new JSZip();
    // more files !
    dataArr.forEach((item) => {
      zip
        .loadAsync(file)
        .then((content) => {
          // you now have every files contained in the loaded zip
          return content.files[`data/${item}.json`].async("text"); // a promise of "Hello World\n"
        })
        .then((text) => {
          if (text) {
            if (item === "notes" || item === "books" || item === "bookmarks") {
              localforage.setItem(item, JSON.parse(text));
            } else {
              localStorage.setItem(item, text);
            }
          }
        })
        .then(() => {
          if (item === "books") {
            localforage.getItem("books").then((value: any) => {
              let zip = new JSZip();
              value &&
                value.forEach((item: any) => {
                  zip
                    .loadAsync(file)
                    .then((content) => {
                      // you now have every files contained in the loaded zip
                      return content.files[`epub/${item.name}.epub`].async(
                        "arraybuffer"
                      ); // a promise of "Hello World\n"
                    })
                    .then((book) => {
                      item.content = book;
                    })
                    .then(() => {
                      localforage.setItem("books", value).then(() => {
                        handleFinish();
                      });
                    })
                    .catch(() => {
                      console.log("Error occurs");
                    });
                });
            });
          }
        })
        .catch(() => {
          console.log("Error happen");
        });
    });
  };
}

export default RestoreUtil;
