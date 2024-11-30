import { isElectron } from "react-device-detect";
import Bookmark from "../../models/Bookmark";
import { getStorageLocation } from "../common";
import SqlUtil from "../file/sqlUtil";
declare var window: any;

class BookmarkService {
  static async getDbBuffer() {
    let sqlUtil = new SqlUtil();
    let bookmarks = await this.getAllBookmarks();
    return sqlUtil.JsonToDbBuffer(bookmarks, "bookmarks");
  }
  static async getAllBookmarks(): Promise<Bookmark[]> {
    if (isElectron) {
      let bookmarks = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getAllStatement",
          statementType: "string",
          executeType: "all",
          dbName: "bookmarks",
          storagePath: getStorageLocation(),
        });
      return bookmarks;
    } else {
      const bookmarks = (await window.localforage.getItem("bookmarks")) || [];
      return bookmarks;
    }
  }
  static async saveAllBookmarks(bookmarks: Bookmark[]) {
    if (isElectron) {
      for (let bookmark of bookmarks) {
        await window
          .require("electron")
          .ipcRenderer.invoke("database-command", {
            statement: "saveStatement",
            statementType: "string",
            executeType: "run",
            dbName: "bookmarks",
            data: bookmark,
            storagePath: getStorageLocation(),
          });
      }
    } else {
      await window.localforage.setItem("bookmarks", bookmarks);
    }
  }
  static async deleteAllBookmarks() {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "deleteAllStatement",
        statementType: "string",
        executeType: "run",
        dbName: "bookmarks",
        storagePath: getStorageLocation(),
      });
    } else {
      await window.localforage.removeItem("bookmarks");
    }
  }
  static async saveBookmark(bookmark: Bookmark) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "saveStatement",
        statementType: "string",
        executeType: "run",
        dbName: "bookmarks",
        data: bookmark,
        storagePath: getStorageLocation(),
      });
    } else {
      let bookmarks = await this.getAllBookmarks();
      bookmarks.push(bookmark);
      await this.saveAllBookmarks(bookmarks);
    }
  }
  static async deleteBookmark(key: string) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "deleteStatement",
        statementType: "string",
        executeType: "run",
        dbName: "bookmarks",
        data: key,
        storagePath: getStorageLocation(),
      });
    } else {
      let bookmarks = await this.getAllBookmarks();
      bookmarks = bookmarks.filter((b) => b.key !== key);
      if (bookmarks.length === 0) {
        await this.deleteAllBookmarks();
      } else {
        await this.saveAllBookmarks(bookmarks);
      }
    }
  }
  static async updateBookmark(bookmark: Bookmark) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "updateStatement",
        statementType: "string",
        executeType: "run",
        dbName: "bookmarks",
        data: bookmark,
        storagePath: getStorageLocation(),
      });
    } else {
      let bookmarks = await this.getAllBookmarks();
      bookmarks = bookmarks.map((b) => {
        if (b.key === bookmark.key) {
          return bookmark;
        }
        return b;
      });
      await this.saveAllBookmarks(bookmarks);
    }
  }
  static async getBookmark(key: string): Promise<Bookmark | null> {
    if (isElectron) {
      let bookmark = window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getStatement",
          statementType: "string",
          executeType: "get",
          dbName: "bookmarks",
          data: key,
          storagePath: getStorageLocation(),
        });
      return bookmark;
    } else {
      let bookmarks = await this.getAllBookmarks();
      for (let bookmark of bookmarks) {
        if (bookmark.key === key) {
          return bookmark;
        }
      }
      return null;
    }
  }
  static async getBookmarksByBookKey(bookKey: string): Promise<Bookmark[]> {
    if (isElectron) {
      let bookmarks = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getByBookKeysStatement",
          statementType: "string",
          executeType: "all",
          dbName: "bookmarks",
          data: bookKey,
          storagePath: getStorageLocation(),
        });
      return bookmarks;
    } else {
      let bookmarks = await this.getAllBookmarks();
      return bookmarks.filter((b) => b.bookKey === bookKey);
    }
  }
  static async getBookmarksByBookKeys(keys: string[]): Promise<Bookmark[]> {
    if (isElectron) {
      let bookmarks = await window
        .require("electron")
        .ipcRenderer.invoke("database-command", {
          statement: "getByBookKeysStatement",
          statementType: "string",
          executeType: "all",
          dbName: "bookmarks",
          data: keys,
          storagePath: getStorageLocation(),
        });
      return bookmarks;
    } else {
      let bookmarks = await this.getAllBookmarks();
      return bookmarks.filter((b) => keys.includes(b.bookKey));
    }
  }
  static async deleteBookmarksByBookKey(bookKey: string) {
    if (isElectron) {
      await window.require("electron").ipcRenderer.invoke("database-command", {
        statement: "deleteByBookKeyStatement",
        statementType: "string",
        executeType: "run",
        dbName: "bookmarks",
        data: bookKey,
        storagePath: getStorageLocation(),
      });
    } else {
      let bookmarks = await this.getAllBookmarks();
      bookmarks = bookmarks.filter((b) => b.bookKey !== bookKey);
      if (bookmarks.length === 0) {
        await this.deleteAllBookmarks();
      } else {
        await this.saveAllBookmarks(bookmarks);
      }
    }
  }
}

export default BookmarkService;
