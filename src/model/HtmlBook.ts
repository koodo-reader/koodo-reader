class HtmlBook {
  key: string;
  doc: HTMLElement;
  chapters: { label: string; id: string; href: string }[];
  subitems: any;
  chapterDoc: { title: string; text: string }[];
  constructor(
    key: string,
    doc: HTMLElement,
    chapters: { label: string; id: string; href: string }[],
    subitems: any,
    chapterDoc: { title: string; text: string }[]
  ) {
    this.key = key;
    this.doc = doc;
    this.chapters = chapters;
    this.subitems = subitems;
    this.chapterDoc = chapterDoc;
  }
}

export default HtmlBook;
