class HtmlBook {
  key: string;
  chapters: { label: string; id: string; href: string }[];
  flattenChapters: { label: string; id: string; href: string }[];
  rendition: any;
  constructor(
    key: string,
    chapters: { label: string; id: string; href: string }[],
    flattenChapters: { label: string; id: string; href: string }[],
    rendition: any
  ) {
    this.key = key;
    this.chapters = chapters;
    this.flattenChapters = flattenChapters;
    this.rendition = rendition;
  }
}

export default HtmlBook;
