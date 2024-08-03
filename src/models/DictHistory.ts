class DictHistory {
  key: string;
  bookKey: string;
  date: { year: number; month: number; day: number };
  word: string;
  chapter: string;
  constructor(bookKey: string, word: string, chapter: string) {
    this.key = new Date().getTime() + "";
    this.bookKey = bookKey;
    this.date = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    };
    this.word = word;
    this.chapter = chapter;
  }
}

export default DictHistory;
