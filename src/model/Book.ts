class Book {
  key: string;
  name: string;
  author: string;
  description: string;
  md5: string;
  cover: string;
  constructor(
    key: string,
    name: string,
    author: string,
    description: string,
    md5: string,
    cover: string
  ) {
    this.key = key; // 数据库的键
    this.name = name; // 书籍名
    this.author = author; // 作者
    this.description = description; // 书籍的描述
    this.md5 = md5; //epub的md5值，防止重复导入
    this.cover = cover;
  }
}

export default Book;
