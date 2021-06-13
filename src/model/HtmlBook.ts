class HtmlBook {

  doc:HTMLElement;
  chapters:{label:string,id:string,href:string}[];
  subitems:any;
  constructor(
    doc:HTMLElement,
    chapters:{label:string,id:string,href:string}[],
    subitems:any,
  ) {
    this.doc=doc,
    this.chapters=chapters,
    this.subitems=subitems
  }
}

export default HtmlBook;
