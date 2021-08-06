class RecordLocation {
  static recordCfi(bookKey: string, cfi: string, percentage: number) {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json!) || {};
    obj[bookKey] = { cfi: cfi, percentage: percentage };
    localStorage.setItem("recordLocation", JSON.stringify(obj));
  }

  static getCfi(bookKey: string) {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json!) || {};
    return obj[bookKey] || {};
  }
  static recordScrollHeight(
    bookKey: string,
    width: number,
    height: number,
    scroll: number,
    length: number
  ) {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json!) || {};
    obj[bookKey] = { width, height, scroll, length };
    localStorage.setItem("recordLocation", JSON.stringify(obj));
  }

  static getScrollHeight(bookKey: string) {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json!) || {};
    return obj[bookKey] || {};
  }
  static getAllCfi() {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json!) || {};
    return obj;
  }
  static clear(bookKey: string) {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json!) || {};
    delete obj[bookKey];
    localStorage.setItem("recordLocation", JSON.stringify(obj));
  }
}

export default RecordLocation;
