// 记录书本打开记录
class RecordRecent {
  static setRecent(bookKey: string) {
    let json = localStorage.getItem("recentBooks");
    let obj = JSON.parse(json) || {};
    let date = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    };
    obj[bookKey] = { bookKey: bookKey, date: date };
    localStorage.setItem("recentBooks", JSON.stringify(obj));
  }

  static getRecent() {
    let json = localStorage.getItem("recentBooks");
    let obj = JSON.parse(json) || {};
    return obj || null;
  }
  static clear(bookKey: string) {
    let json = localStorage.getItem("recentBooks");
    let obj = JSON.parse(json) || {};
    delete obj[bookKey];
    localStorage.setItem("recentBooks", JSON.stringify(obj));
  }
}

export default RecordRecent;
