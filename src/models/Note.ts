export type NoteType = "text" | "markdown" | "html";

export const normalizeNoteType = (type?: string | null): NoteType =>
  type === "markdown" || type === "html" ? type : "text";

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
  percentage: string;
  color: string;
  tag: string[];
  type: NoteType;
  constructor(
    bookKey: string,
    chapter: string,
    chapterIndex: number,
    text: string,
    cfi: string,
    range: string,
    notes: string,
    percentage: string,
    color: string,
    tag: string[],
    type: NoteType = "text"
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
    this.type = normalizeNoteType(type);
  }
}

export default Note;
