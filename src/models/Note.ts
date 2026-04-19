// Use crypto.randomUUID for globally unique key generation instead of timestamp
const generateNoteKey = (): string => {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const getCurrentDate = (): { year: number; month: number; day: number } => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
};

class Note {
  readonly key: string;
  readonly bookKey: string;
  readonly date: { year: number; month: number; day: number };
  readonly chapter: string;
  readonly chapterIndex: number;
  readonly text: string;
  readonly cfi: string;
  readonly range: string;
  readonly notes: string;
  readonly percentage: string;
  readonly color: number;
  readonly tag: string[];
  constructor(
    bookKey: string,
    chapter: string,
    chapterIndex: number,
    text: string,
    cfi: string,
    range: string,
    notes: string,
    percentage: string,
    color: number,
    tag: string[]
  ) {
    this.key = generateNoteKey();
    this.bookKey = bookKey;
    this.date = getCurrentDate();
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
