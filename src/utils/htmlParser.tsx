class HtmlParser {
  bookDoc: any;
  contentList: HTMLElement[];
  contentTitleList: any[];
  constructor(bookDoc: any) {
    this.bookDoc = bookDoc;
    this.contentList = [];
    this.contentTitleList = [];
    this.getContent(bookDoc);
  }
  getContent(bookDoc: HTMLElement) {
    this.contentList = Array.from(
      bookDoc.querySelectorAll("h1,h2,h3,h4,h5,font")
    );
    for (let i = 0; i < this.contentList.length; i++) {
      let random = Math.floor(Math.random() * 900) + 100;
      this.contentTitleList.push({
        label: this.contentList[i].innerText,
        id: this.contentList[i].innerText.replace(/ /g, "_") + random,
        href: "#" + this.contentList[i].innerText.replace(/ /g, "_") + random,
        subitems: [],
      });
    }
    for (let i = 0; i < this.contentList.length; i++) {
      this.contentList[i].id = this.contentTitleList[i].id;
    }
  }
  getAnchoredDoc() {
    return this.bookDoc;
  }
  getContentList() {
    return this.contentTitleList;
  }
}

export default HtmlParser;
