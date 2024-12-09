class BookLocation {
  bookKey: string;
  text: string;
  chapterTitle: string;
  chapterDocIndex: string;
  chapterHref: string;
  count: string;
  percentage: string;
  cfi: string;
  page: string;
  constructor(
    bookKey: string,
    text: string,
    chapterTitle: string,
    chapterDocIndex: string,
    chapterHref: string,
    count: string,
    percentage: string,
    cfi: string,
    page: string
  ) {
    this.bookKey = bookKey;
    this.text = text;
    this.chapterTitle = chapterTitle;
    this.chapterDocIndex = chapterDocIndex;
    this.chapterHref = chapterHref;
    this.count = count;
    this.percentage = percentage;
    this.cfi = cfi;
    this.page = page;
  }
}

export default BookLocation;
