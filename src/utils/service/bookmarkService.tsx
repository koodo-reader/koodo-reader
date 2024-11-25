import Bookmark from "../../models/Bookmark";
declare var window: any;

class BookmarkService {
  static async getAllBookmarks(): Promise<Bookmark[]> {
    const bookmarks = (await window.localforage.getItem("bookmarks")) || [];
    return bookmarks;
  }
  static async saveAllBookmarks(bookmarks: Bookmark[]) {
    await window.localforage.setItem("bookmarks", bookmarks);
  }
  static async deleteAllBookmarks() {
    await window.localforage.removeItem("bookmarks");
  }
  static async saveBookmark(bookmark: Bookmark) {
    let bookmarks = await this.getAllBookmarks();
    bookmarks.push(bookmark);
    await this.saveAllBookmarks(bookmarks);
  }
  static async deleteBookmark(key: string) {
    let bookmarks = await this.getAllBookmarks();
    bookmarks = bookmarks.filter((b) => b.key !== key);
    if (bookmarks.length === 0) {
      await this.deleteAllBookmarks();
    } else {
      await this.saveAllBookmarks(bookmarks);
    }
  }
  static async updateBookmark(bookmark: Bookmark) {
    let bookmarks = await this.getAllBookmarks();
    bookmarks = bookmarks.map((b) => {
      if (b.key === bookmark.key) {
        return bookmark;
      }
      return b;
    });
    await this.saveAllBookmarks(bookmarks);
  }
  static async getBookmark(key: string): Promise<Bookmark | null> {
    let bookmarks = await this.getAllBookmarks();
    for (let bookmark of bookmarks) {
      if (bookmark.key === key) {
        return bookmark;
      }
    }
    return null;
  }
}

export default BookmarkService;
