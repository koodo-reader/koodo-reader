class Highlighter {
  key: string;
  bookKey: string;
  cfi: string;
  color: number;
  range: string;
  constructor(
    key: string,
    bookKey: string,
    cfi: string,
    range: string,
    color: number
  ) {
    this.key = key; //高亮的键值
    this.bookKey = bookKey; //高亮的书的键值
    this.cfi = cfi; //高亮的所在位置
    this.color = color; //高亮使用的颜色
    this.range = range; // Rangy.js产生的将Range对象序列化后的字符串
  }
}

export default Highlighter;
