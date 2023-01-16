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
  static recordHtmlLocation(
    bookKey: string,
    text: string,
    chapterTitle: string,
    chapterDocIndex: string,
    chapterHref: string,
    count: string,
    percentage: string,
    cfi: string
  ) {
    if (cfi) {
      let json = localStorage.getItem("recordLocation");
      let obj = JSON.parse(json || "{}");
      obj[bookKey] = {
        text,
        chapterTitle,
        chapterDocIndex,
        chapterHref,
        count,
        percentage,
        cfi,
      };
      localStorage.setItem("recordLocation", JSON.stringify(obj));
    } else {
      if (
        (!text ||
          !chapterTitle ||
          !chapterDocIndex ||
          !chapterHref ||
          !count ||
          !percentage) &&
        document.location.href.indexOf("/cb") === -1 //漫画的情况，cbr,cbt,cbz
      )
        return;

      let json = localStorage.getItem("recordLocation");
      let obj = JSON.parse(json || "{}");
      obj[bookKey] = {
        text,
        chapterTitle,
        chapterDocIndex,
        chapterHref,
        count,
        percentage,
        cfi,
      };
      localStorage.setItem("recordLocation", JSON.stringify(obj));
    }
  }

  static getHtmlLocation(bookKey: string) {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json || "{}");
    return obj[bookKey] || {};
  }
  static getPDFLocation(fingerprint: string) {
    let json = localStorage.getItem("pdfjs.history");
    let arr = JSON.parse(json || "{}").files || [];
    return arr[_.findLastIndex(arr, { fingerprint })] || {};
  }
  static recordPDFLocation(fingerprint: string, obj: object) {
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
