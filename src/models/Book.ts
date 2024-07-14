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
    charset: string
  ) {
    this.key = key; // 数据库的键
    this.name = name; // 书籍名
    this.author = author; // 作者
    this.description = description; // 书籍的描述
    this.md5 = md5; //epub的md5值，防止重复导入
    this.cover = cover;
    this.format = format;
    this.publisher = publisher;
    this.size = size;
    this.page = page;
    this.path = path;
    this.charset = charset;
  }
}

export default Book;
