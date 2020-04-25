class Bookmark {
  key: string;
  bookKey: string;
  cfi: string;
  label: string;
  percentage: number;
  chapter: string;
  constructor(
    bookKey: string,
    cfi: string,
    label: string,
    percentage: number,
    chapter: string
  ) {
    this.key = new Date().getTime() + ""; // 唯一的键
    this.bookKey = bookKey; // 所属的书籍的键
    this.cfi = cfi; // 标记阅读位置的cfi
    this.label = label; // 此项书签的别名
    this.percentage = percentage; // 此项书签的摘要
    this.chapter = chapter; // 此项书签的摘要
  }
}

export default Bookmark;
