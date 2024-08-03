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
    this.key = new Date().getTime() + "";
    this.bookKey = bookKey;
    this.date = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    };
    this.chapter = chapter;
    this.chapterIndex = chapterIndex;
    this.text = text;
    this.cfi = cfi;
    this.range = range;
    this.notes = notes || "";
    this.percentage = percentage;
    this.color = color;
    this.tag = tag;
  }
}

export default Note;
