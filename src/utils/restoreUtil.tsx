import localforage from "localforage";
import BookModel from "../model/Book";

let JSZip = (window as any).JSZip;

class RestoreUtil {
  static importBooks = (
    books: BookModel[],
    file: any,
    handleFinish: () => void
  ) => {
    let zip = new JSZip();
    books.forEach((item, index) => {
      zip
        .loadAsync(file)
        .then((content: any) => {
          // you now have every files contained in the loaded zip
          if (item.description === "pdf") {
            return content.files[`book/${item.name}.pdf`].async("arraybuffer"); // a promise of "Hello World\n"
          } else {
            return content.files[`book/${item.name}.epub`].async("arraybuffer"); // a promise of "Hello World\n"
          }
        })
        .then((book: any) => {
          localforage.setItem(item.key, book);
          // item.content = book;
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
    let configArr = [
      "notes",
      "books",
      "bookmarks",
      "readerConfig",
      "noteTags",
      "bookSortCode",
      "noteSortCode",
      "readingTime",
      "recentBooks",
      "favoriteBooks",
      "favoriteBooks",
      "shelfList",
      "pdfjs.history",
      "recordLocation",
    ];
    let zip = new JSZip();
    // more files !
    configArr.forEach((item) => {
      zip
        .loadAsync(file)
        .then((content: any) => {
          // you now have every files contained in the loaded zip
          return content.files[`config/${item}.json`].async("text"); // a promise of "Hello World\n"
        })
        .then((text: any) => {
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
                    .then((content: any) => {
                      // you now have every files contained in the loaded zip
                      if (item.description === "pdf") {
                        return content.files[`book/${item.name}.pdf`].async(
                          "arraybuffer"
                        ); // a promise of "Hello World\n"
                      } else {
                        return content.files[`book/${item.name}.epub`].async(
                          "arraybuffer"
                        ); // a promise of "Hello World\n"
                      }
                    })
                    .then((book: any) => {
                      localforage.setItem(item.key, book).then(() => {
                        handleFinish();
                        setTimeout(() => {
                          window.location.reload();
                        }, 500);
                      });
                    })
                    .catch((err: any) => {
                      console.log(err, "Error occurs");
                    });
                });
            });
          }
        })
        .catch((err: any) => {
          console.log(err, "Error happen");
        });
    });
  };
}

export default RestoreUtil;
