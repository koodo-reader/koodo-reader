class Note {
  key: string;
  bookKey: string;
  date: { year: number; month: number; day: number };
  chapter: string;
  text: string;
  cfi: string;
  range: string;
  notes: string;
  percentage: number;
  constructor(
    bookKey: string,
    chapter: string,
    text: string,
    cfi: string,
    range: string,
    notes: string,
    percentage: number
  ) {
    this.key = new Date().getTime() + ""; //笔记的键值
    this.bookKey = bookKey; //笔记的所在书的键值
    this.date = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    }; //笔记的添加日期
    this.chapter = chapter; //笔记的所在章节
    this.text = text; //笔记对应的书本的内容
    this.cfi = cfi; //添加笔记的位置
    this.range = range; // Rangy.js产生的将Range对象序列化后的字符串
    this.notes = notes || ""; //笔记的内容
    this.percentage = percentage; //笔记的内容
  }
}

export default Note;
