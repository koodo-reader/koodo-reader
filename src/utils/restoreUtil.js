// import localforage from "localforage";
import JSZip from "jszip";
// import FileSaver from "file-saver";
import localforage from "localforage";
class RestoreUtil {
  static importBooks = (books, file, handleFinish) => {
    // console.log("huifusdg");
    let zip = new JSZip();
    books.forEach((item, index) => {
      zip
        .loadAsync(file)
        .then(content => {
          // console.log(`epub/${item.name}.epub`);
          // you now have every files contained in the loaded zip
          return content.files[`epub/${item.name}.epub`].async("arraybuffer"); // a promise of "Hello World\n"
        })
        .then(book => {
          item.content = book;
        })
        .then(() => {
          // console.log(index, books.length, "huifu");
          if (index === books.length - 1) {
            // console.log("huifu");

            localforage.setItem("books", books).then(() => {
              handleFinish();
            });
          }
        });
    });
  };
  static restore = (file, handleFinish) => {
    let dataArr = [
      "notes",
      "digests",
      "books",
      "highlighters",
      "bookmarks",
      "isList",
      "totalBooks",
      "isSingle",
      "isFirst",
      "sortCode",
      "config",
      "readingTime",
      "recentBooks",
      "shelfList",
      "recordLocation"
    ];
    // let zip = new JSZip();
    let zip = new JSZip();
    // more files !
    dataArr.forEach(item => {
      zip
        .loadAsync(file)
        .then(content => {
          // you now have every files contained in the loaded zip
          return content.files[`data/${item}.json`].async("text"); // a promise of "Hello World\n"
        })
        .then(text => {
          if (
            item === "notes" ||
            item === "books" ||
            item === "digests" ||
            item === "bookmarks" ||
            item === "highlighters"
          ) {
            localforage.setItem(item, JSON.parse(text));
          } else {
            localStorage.setItem(item, text);
          }
        })
        .then(() => {
          // console.log(item, "item");
          if (item === "books") {
            localforage.getItem("books").then(value => {
              this.importBooks(value, file, handleFinish);
            });
          }
        });
    });
  };
}

export default RestoreUtil;
