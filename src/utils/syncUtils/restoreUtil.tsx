import localforage from "localforage";
import BookUtil from "../bookUtil";

let JSZip = (window as any).JSZip;

class RestoreUtil {
  static restore = (file: any, handleFinish: () => void, isSync = false) => {
    let configArr = [
      "notes",
      "books",
      "bookmarks",
      "readerConfig",
      "noteTags",
      "themeColors",
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
          return content.files[
            isSync ? `${item}.json` : `config/${item}.json`
          ].async("text"); // a promise of "Hello World\n"
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
          if (item === "books" && !isSync) {
            localforage.getItem("books").then((value: any) => {
              let zip = new JSZip();
              value &&
                value.forEach((item: any) => {
                  zip
                    .loadAsync(file)
                    .then((content: any) => {
                      if (content.files[`book/${item.key}`]) {
                        return content.files[`book/${item.key}`].async(
                          "arraybuffer"
                        );
                      }

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
                    .then(async (book: any) => {
                      await BookUtil.addBook(item.key, book);
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
    setTimeout(() => {
      handleFinish();
    }, 1000);
  };
}

export default RestoreUtil;
