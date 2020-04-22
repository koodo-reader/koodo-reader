class Digest {
  constructor(bookKey, chapter, text, cfi) {
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
  }
}

export default Digest;
