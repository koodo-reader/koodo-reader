class Digest {
  constructor(bookKey, chapter, text, cfi) {
    this.key = new Date().getTime() + "";
    this.date = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate()
    };
    this.bookKey = bookKey;
    this.chapter = chapter;
    this.text = text;
    this.cfi = cfi;
  }
}

export default Digest;
