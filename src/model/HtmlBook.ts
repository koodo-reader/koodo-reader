class HtmlBook {

  doc:HTMLElement;
  chapters:{label:string,id:string,href:string}[];
  subitems:any;
  chapterDoc:string[];
  constructor(
    doc:HTMLElement,
    chapters:{label:string,id:string,href:string}[],
    subitems:any,
    chapterDoc:string[],
  ) {
    this.doc=doc,
    this.chapters=chapters,
    this.subitems=subitems,
    this.chapterDoc=chapterDoc
  }
}

export default HtmlBook;
