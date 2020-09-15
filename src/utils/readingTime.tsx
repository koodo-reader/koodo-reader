// 记录书本打开记录
class ReadingTime {
  static setTime(bookKey: string, time: number) {
    let json = localStorage.getItem("readingTime");
    let obj = JSON.parse(json!)||{};
    obj[bookKey] = time;
    localStorage.setItem("readingTime", JSON.stringify(obj));
  }

  static getTime(bookKey: string) {
    let json = localStorage.getItem("readingTime");
    let obj = JSON.parse(json!)||{};
    return obj[bookKey] || 0;
  }
  static clearTime(bookKey: string) {
    let json = localStorage.getItem("readingTime");
    let obj = JSON.parse(json!) || {};
    delete obj[bookKey];
    localStorage.setItem("readingTime", JSON.stringify(obj));
  }
}

export default ReadingTime;
