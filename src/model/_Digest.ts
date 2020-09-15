class Digest {
  key: string;
  date: { year: number; month: number; day: number };
  bookKey: string;
  chapter: string;
  text: string;
  cfi: string;
  percentage: number;
  color: number;
  range: string;
  constructor(
    bookKey: string,
    chapter: string,
    text: string,
    cfi: string,
    percentage: number,
    color: number,
    range: string
  ) {
    this.key = new Date().getTime() + ""; //书摘的键值
    this.date = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    }; //添加书摘的日期
    this.bookKey = bookKey; //书摘的所在的书
    this.chapter = chapter; //书摘的所在章节
    this.text = text; //书摘的内容
    this.cfi = cfi; //书摘的所在位置
    this.percentage = percentage; //书摘的所在进度
    this.color = color; //书摘高亮的颜色
    this.range = range; //书摘的所在位置
  }
}

export default Digest;
