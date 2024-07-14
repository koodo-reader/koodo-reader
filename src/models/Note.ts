class Note {
  key: string;
  bookKey: string;
  date: { year: number; month: number; day: number };
  chapter: string;
  chapterIndex: number;
  text: string;
  cfi: string;
  range: string;
  notes: string;
  percentage: number;
  color: number;
  tag: string[];
  constructor(
    bookKey: string,
    chapter: string,
    chapterIndex: number,
    text: string,
    cfi: string,
    range: string,
    notes: string,
    percentage: number,
    color: number,
    tag: string[]
  ) {
    this.key = new Date().getTime() + ""; //笔记的键值
    this.bookKey = bookKey; //笔记的所在书的键值
    this.date = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    }; //笔记的添加日期
    this.chapter = chapter; //笔记的所在章节
    this.chapterIndex = chapterIndex; //笔记的所在章节
    this.text = text; //笔记对应的书本的内容
    this.cfi = cfi; //添加笔记的位置
    this.range = range; // Rangy.js产生的将Range对象序列化后的字符串
    this.notes = notes || ""; //笔记的内容
    this.percentage = percentage; //笔记在文中的进度
    this.color = color; //笔记高亮的颜色
    this.tag = tag; //笔记高亮的颜色
  }
}

export default Note;
