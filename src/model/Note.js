class Note {
  constructor(bookKey, chapter, text, cfi, range, notes) {
    this.key = new Date().getTime() + "";
    this.bookKey = bookKey;
    this.date = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate()
    };
    this.chapter = chapter;
    this.text = text;
    this.cfi = cfi;
    this.range = range; // Rangy.js产生的将Range对象序列化后的字符串
    this.notes = notes || "";
  }
}

export default Note;
