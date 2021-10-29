class HtmlBook {
  key: string;
  chapters: { label: string; id: string; href: string }[];
  subitems: any;
  rendition: any;
  constructor(
    key: string,
    chapters: { label: string; id: string; href: string }[],
    subitems: any,
    rendition: any
  ) {
    this.key = key;
    this.chapters = chapters;
    this.subitems = subitems;
    this.rendition = rendition;
  }
}

export default HtmlBook;
