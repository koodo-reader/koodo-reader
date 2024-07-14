class DictHistory {
  key: string;
  bookKey: string;
  date: { year: number; month: number; day: number };
  word: string;
  chapter: string;
  constructor(bookKey: string, word: string, chapter: string) {
    this.key = new Date().getTime() + ""; // 唯一的键
    this.bookKey = bookKey; // 所属的书籍的键
    this.date = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    }; //笔记的添加日期
    this.word = word; // 此项书签的别名
    this.chapter = chapter; // 此项书签的摘要
  }
}

export default DictHistory;
