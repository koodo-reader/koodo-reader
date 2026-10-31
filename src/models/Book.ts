class Book {
  key: string;
  name: string;
  author: string;
  description: string;
  md5: string;
  cover: string;
  format: string;
  publisher: string;
  size: number;
  page: number;
  path: string;
  charset: string;
  published: string;
  modified: string;
  identifier: string;
  language: string;
  subject: string;
  rights: string;
  isbn: string;
  layout: string;
  constructor(
    key: string,
    name: string,
    author: string,
    description: string,
    md5: string,
    cover: string,
    format: string,
    publisher: string,
    size: number,
    page: number,
    path: string,
    charset: string,
    published = "",
    modified = "",
    identifier = "",
    language = "",
    subject = "",
    rights = "",
    isbn = "",
    layout = ""
  ) {
    this.key = key;
    this.name = name;
    this.author = author;
    this.description = description;
    this.md5 = md5;
    this.cover = cover;
    this.format = format;
    this.publisher = publisher;
    this.size = size;
    this.page = page;
    this.path = path;
    this.charset = charset;
    this.published = published;
    this.modified = modified;
    this.identifier = identifier;
    this.language = language;
    this.subject = subject;
    this.rights = rights;
    this.isbn = isbn;
    this.layout = layout;
  }
}

export default Book;
