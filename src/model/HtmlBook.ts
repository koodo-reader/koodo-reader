class HtmlBook {
  key: string;
  chapters: { title: string; id: string; href: string; index: number }[];
  flattenChapters: { title: string; id: string; href: string; index: number }[];
  rendition: any;
  constructor(
    key: string,
    chapters: { title: string; id: string; href: string; index: number }[],
    flattenChapters: {
      title: string;
      id: string;
      href: string;
      index: number;
    }[],
    rendition: any
  ) {
    this.key = key;
    this.chapters = chapters;
    this.flattenChapters = flattenChapters;
    this.rendition = rendition;
  }
}

export default HtmlBook;
