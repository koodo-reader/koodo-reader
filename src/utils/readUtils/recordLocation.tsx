import _ from "underscore";

class RecordLocation {
  static recordCfi(bookKey: string, cfi: string, percentage: number) {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json || "{}");
    obj[bookKey] = { cfi: cfi, percentage: percentage };
    localStorage.setItem("recordLocation", JSON.stringify(obj));
  }

  static getCfi(bookKey: string) {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json || "{}");
    return obj[bookKey] || {};
  }
  static recordScrollHeight(
    bookKey: string,
    text: string,
    chapterTitle: string,
    count: string
  ) {
    if (
      (!text || !chapterTitle || !count) &&
      document.location.href.indexOf("/cb") === -1
    )
      return;
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json || "{}");
    obj[bookKey] = { text, chapterTitle, count };
    localStorage.setItem("recordLocation", JSON.stringify(obj));
  }

  static getScrollHeight(bookKey: string) {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json || "{}");
    return obj[bookKey] || {};
  }
  static getPDFlocation(fingerprint: string) {
    let json = localStorage.getItem("pdfjs.history");
    let arr = JSON.parse(json || "{}").files || [];
    return arr[_.findLastIndex(arr, { fingerprint })] || {};
  }
  static recordPDFlocation(fingerprint: string, obj: object) {
    let json = localStorage.getItem("pdfjs.history");
    let _obj = JSON.parse(json || "{}");
    _obj.files[_.findLastIndex(_obj.files, { fingerprint })] = obj;
    localStorage.setItem("pdfjs.history", JSON.stringify(_obj));
  }
  static getAllCfi() {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json || "{}");
    return obj;
  }
  static clear(bookKey: string) {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json || "{}");
    delete obj[bookKey];
    localStorage.setItem("recordLocation", JSON.stringify(obj));
  }
}

export default RecordLocation;
