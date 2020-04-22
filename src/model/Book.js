class Book {
  constructor(name, author, description, content, md5) {
    this.key = new Date().getTime() + ""; // 数据库的键
    this.name = name; // 书籍名
    this.author = author; // 作者
    this.description = description; // 书籍的描述
    this.content = content; // 代表内容的二进制数据
    this.md5 = md5; //epub的md5值，防止重复导入
  }
}

export default Book;
