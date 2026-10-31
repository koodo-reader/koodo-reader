class Collection {
  key: string;
  name: string;
  books: string[];
  constructor(key: string, name: string, books: string[]) {
    this.key = key;
    this.name = name;
    this.books = books;
  }
}

export default Collection;
