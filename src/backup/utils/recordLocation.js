// 阅读期间自动记录当前阅读位置
class RecordLocation {
  static recordCfi(bookKey, cfi, percentage) {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json) || {};
    obj[bookKey] = { cfi: cfi, percentage: percentage };
    // console.log(cfi, "dfhdafhdfh");
    localStorage.setItem("recordLocation", JSON.stringify(obj));
  }

  static getCfi(bookKey) {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json) || {};

    return obj[bookKey] || {};
  }

  static clear(bookKey) {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json) || {};
    delete obj[bookKey];

    localStorage.setItem("recordLocation", JSON.stringify(obj));
  }
}

export default RecordLocation;
