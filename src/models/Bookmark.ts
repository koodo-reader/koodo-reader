class Bookmark {
  key: string;
  bookKey: string;
  cfi: string;
  label: string;
  percentage: string;
  chapter: string;
  constructor(
    bookKey: string,
    cfi: string,
    label: string,
    percentage: string,
    chapter: string
  ) {
    this.key = new Date().getTime() + "";
    this.bookKey = bookKey;
    this.cfi = cfi;
    this.label = label;
    this.percentage = percentage;
    this.chapter = chapter;
  }
}

export default Bookmark;
