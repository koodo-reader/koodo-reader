// 记录书本打开记录
class ReadingTime {
  static setTime(bookKey, time) {
    let json = localStorage.getItem("readingTime");
    let obj = JSON.parse(json) || {};

    // let openTime = new Date().getTime();
    obj[bookKey] = time;
    // console.log(cfi, "dfhdafhdfh");
    localStorage.setItem("readingTime", JSON.stringify(obj));
  }

  static getTime(bookKey) {
    let json = localStorage.getItem("readingTime");
    let obj = JSON.parse(json) || {};

    return obj[bookKey] || 0;
  }
  static clearTime(bookKey) {
    let json = localStorage.getItem("readingTime");
    let obj = JSON.parse(json) || {};
    delete obj[bookKey];

    localStorage.setItem("readingTime", JSON.stringify(obj));
  }
}

export default ReadingTime;
