class RecordLocation {
  static recordHtmlLocation(
    bookKey: string,
    text: string,
    chapterTitle: string,
    chapterDocIndex: string,
    chapterHref: string,
    count: string,
    percentage: string,
    cfi: string,
    page: string
  ) {
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
      page,
    };
    localStorage.setItem("recordLocation", JSON.stringify(obj));
  }

  static getHtmlLocation(bookKey: string) {
    let json = localStorage.getItem("recordLocation");
    let obj = JSON.parse(json || "{}");
    return obj[bookKey] || {};
  }

  static getAllHtmlLocation() {
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
