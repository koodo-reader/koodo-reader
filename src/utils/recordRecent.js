// 记录书本打开记录
class RecordRecent {
  static setRecent(bookKey) {
    let json = localStorage.getItem("recentBooks");
    let obj = JSON.parse(json) || {};
    let date = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate()
    };
    // let openTime = new Date().getTime();
    obj[bookKey] = { bookKey: bookKey, date: date };
    // console.log(cfi, "dfhdafhdfh");
    localStorage.setItem("recentBooks", JSON.stringify(obj));
  }

  static getRecent() {
    let json = localStorage.getItem("recentBooks");
    let obj = JSON.parse(json) || {};

    return obj || null;
  }
  static clear(bookKey) {
    let json = localStorage.getItem("recentBooks");
    let obj = JSON.parse(json) || {};
    delete obj[bookKey];

    localStorage.setItem("recentBooks", JSON.stringify(obj));
  }
}

export default RecordRecent;
