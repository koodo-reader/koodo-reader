import Book from "../../models/Book";
declare var window: any;

class BookService {
  static async getAllBooks(): Promise<Book[]> {
    const books = (await window.localforage.getItem("books")) || [];
    return books;
  }
  static async saveAllBooks(books: Book[]) {
    await window.localforage.setItem("books", books);
  }
  static async saveBook(book: Book) {
    let books = await this.getAllBooks();
    books.push(book);
    await this.saveAllBooks(books);
  }
  static async deleteBook(key: string) {
    let books = await this.getAllBooks();
    books = books.filter((b) => b.key !== key);
    await this.saveAllBooks(books);
  }
  static async updateBook(book: Book) {
    let books = await this.getAllBooks();
    books = books.map((b) => {
      if (b.key === book.key) {
        return book;
      }
      return b;
    });
    await this.saveAllBooks(books);
  }
  static async getBook(key: string): Promise<Book | null> {
    let books = await this.getAllBooks();
    for (let book of books) {
      if (book.key === key) {
        return book;
      }
    }
    return null;
  }
  static async getBooksByKeys(keys: string[]): Promise<Book[]> {
    let books = await this.getAllBooks();
    return books.filter((b) => keys.includes(b.key));
  }
}

export default BookService;
