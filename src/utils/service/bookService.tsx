import { isElectron } from "react-device-detect";
import Book from "../../models/Book";
import { getStorageLocation } from "../common";
declare var window: any;

class BookService {
  static async getAllBooks(): Promise<Book[]> {
    if (isElectron) {
      let books = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getAllStatement",
          statementType: "string",
          executeType: "all",
          dbName: "books",
          storagePath: getStorageLocation(),
        });
      return books;
    } else {
      const books = (await window.localforage.getItem("books")) || [];
      return books;
    }
  }
  static async saveAllBooks(books: Book[]) {
    if (isElectron) {
      for (let book of books) {
        await window
          .require("electron")
          .ipcRenderer.invoke("database-command", {
            statement: "saveStatement",
            statementType: "string",
            executeType: "run",
            dbName: "books",
            data: book,
            storagePath: getStorageLocation(),
          });
      }
    } else {
      await window.localforage.setItem("books", books);
    }
  }
  static async saveBook(book: Book) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "saveStatement",
        statementType: "string",
        executeType: "run",
        dbName: "books",
        data: book,
        storagePath: getStorageLocation(),
      });
    } else {
      let books = await this.getAllBooks();
      books.push(book);
      await this.saveAllBooks(books);
    }
  }
  static async deleteBook(key: string) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "deleteStatement",
        statementType: "string",
        executeType: "run",
        dbName: "books",
        data: key,
        storagePath: getStorageLocation(),
      });
    } else {
      let books = await this.getAllBooks();
      books = books.filter((b) => b.key !== key);
      await this.saveAllBooks(books);
    }
  }
  static async updateBook(book: Book) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "updateStatement",
        statementType: "string",
        executeType: "run",
        dbName: "books",
        data: book,
        storagePath: getStorageLocation(),
      });
    } else {
      let books = await this.getAllBooks();
      books = books.map((b) => {
        if (b.key === book.key) {
          return book;
        }
        return b;
      });
      await this.saveAllBooks(books);
    }
  }
  static async getBook(key: string): Promise<Book | null> {
    if (isElectron) {
      let book = window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getStatement",
          statementType: "string",
          executeType: "get",
          dbName: "books",
          data: key,
          storagePath: getStorageLocation(),
        });
      return book;
    } else {
      let books = await this.getAllBooks();
      for (let book of books) {
        if (book.key === key) {
          return book;
        }
      }
      return null;
    }
  }
  static async getBooksByKeys(keys: string[]): Promise<Book[]> {
    if (isElectron) {
      let books = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getByBookKeysStatement",
          statementType: "function",
          executeType: "all",
          dbName: "books",
          data: keys,
          storagePath: getStorageLocation(),
        });
      return books;
    } else {
      let books = await this.getAllBooks();
      return books.filter((b) => keys.includes(b.key));
    }
  }
  static async getBooksArrayBuffer() {
    if (isElectron) {
      let books = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getAllStatement",
          statementType: "string",
          executeType: "all",
          dbName: "books",
          storagePath: getStorageLocation(),
        });
      return books;
    } else {
      return await window.localforage.getItem("books");
    }
  }
}

export default BookService;
