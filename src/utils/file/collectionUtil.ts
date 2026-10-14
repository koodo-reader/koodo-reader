import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import Collection from "../../models/Collection";
import BookModel from "../../models/Book";

class CollectionUtil {
  private static raw: string | null = null;
  private static cache: { [key: string]: Collection } | null = null;
  private static bookMap: { [bookKey: string]: string } | null = null;
  private static deletedRaw: string | null = null;
  private static deletedSet: { [key: string]: boolean } | null = null;

  static clearCache() {
    this.raw = null;
    this.cache = null;
    this.bookMap = null;
    this.deletedRaw = null;
    this.deletedSet = null;
  }

  static getAllCollections(): { [key: string]: Collection } {
    let raw = ConfigService.getItem("bookCollection") || "{}";
    if (raw !== this.raw || !this.cache) {
      this.raw = raw;
      this.bookMap = null;
      let parsed: any = {};
      try {
        parsed = JSON.parse(raw) || {};
      } catch {
        parsed = {};
      }
      this.cache = {};
      for (let key in parsed) {
        let item = parsed[key] || {};
        this.cache[key] = new Collection(
          item.key || key,
          typeof item.name === "string" ? item.name : "",
          Array.isArray(item.books)
            ? item.books.filter((bookKey: any) => typeof bookKey === "string")
            : []
        );
      }
    }
    return this.cache!;
  }

  static getCollectionList(): Collection[] {
    let all = this.getAllCollections();
    return Object.keys(all).map((key) => all[key]);
  }

  static getCollectionKeys(): string[] {
    return Object.keys(this.getAllCollections());
  }

  static isCollection(key: string): boolean {
    if (!key) return false;
    return this.getAllCollections().hasOwnProperty(key);
  }

  static getCollection(key: string): Collection | null {
    if (!key) return null;
    let all = this.getAllCollections();
    return all.hasOwnProperty(key) ? all[key] : null;
  }

  static getCollectionByBook(bookKey: string): Collection | null {
    if (!bookKey) return null;
    if (!this.bookMap) {
      this.bookMap = {};
      let all = this.getAllCollections();
      for (let key in all) {
        all[key].books.forEach((bookKey) => {
          this.bookMap![bookKey] = key;
        });
      }
    }
    let collectionKey = this.bookMap[bookKey];
    return collectionKey ? this.getCollection(collectionKey) : null;
  }

  static isDeletedKey(key: string): boolean {
    let raw = ConfigService.getItem("deletedBooks") || "[]";
    if (raw !== this.deletedRaw || !this.deletedSet) {
      this.deletedRaw = raw;
      this.deletedSet = {};
      try {
        let parsed = JSON.parse(raw) || [];
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (typeof item === "string") {
              this.deletedSet![item] = true;
            }
          });
        }
      } catch {
        this.deletedSet = {};
      }
    }
    return !!this.deletedSet[key];
  }

  static isCollectionDeleted(collectionKey: string): boolean {
    return this.isDeletedKey(collectionKey);
  }

  static getActiveCollectionByBook(bookKey: string): Collection | null {
    let collection = this.getCollectionByBook(bookKey);
    if (!collection) return null;
    if (this.isCollectionDeleted(collection.key)) return null;
    return collection;
  }

  static getRecentBookKey(bookKey: string): string {
    return this.getActiveCollectionByBook(bookKey)?.key || bookKey;
  }

  static getCollectionAsBook(collection: Collection): BookModel {
    return new BookModel(
      collection.key,
      collection.name,
      "",
      "",
      "",
      "",
      "COLLECTION",
      "",
      0,
      0,
      "",
      ""
    );
  }

  static isCollectionFavorite(collection: Collection): boolean {
    let favoriteBooks = ConfigService.getAllListConfig("favoriteBooks");
    if (favoriteBooks.indexOf(collection.key) > -1) return true;
    return collection.books.some((bookKey) => {
      return favoriteBooks.indexOf(bookKey) > -1;
    });
  }

  static isCollectionInShelf(
    collection: Collection,
    shelfTitle?: string
  ): boolean {
    if (ConfigService.getFromAllMapConfig(collection.key, "shelfList").length > 0) {
      return true;
    }
    if (shelfTitle) {
      let shelfList = ConfigService.getMapConfig(shelfTitle, "shelfList") || [];
      if (shelfList.indexOf(collection.key) > -1) return true;
      return collection.books.some((bookKey) => {
        return shelfList.indexOf(bookKey) > -1;
      });
    }
    return collection.books.some((bookKey) => {
      return ConfigService.getFromAllMapConfig(bookKey, "shelfList").length > 0;
    });
  }

  static getActiveCollectionByBookInShelf(
    bookKey: string,
    shelfTitle?: string
  ): Collection | null {
    let collection = this.getActiveCollectionByBook(bookKey);
    if (!collection) return null;
    if (!shelfTitle) return collection;
    let shelfList = ConfigService.getMapConfig(shelfTitle, "shelfList") || [];
    if (shelfList.indexOf(collection.key) > -1) return collection;
    let inShelf = collection.books.some((memberKey) => {
      return shelfList.indexOf(memberKey) > -1;
    });
    return inShelf ? collection : null;
  }

  static isCollectionNameExists(name: string, excludeKey?: string): boolean {
    let target = (name || "").trim();
    if (!target) return false;
    let all = this.getAllCollections();
    for (let key in all) {
      if (key === excludeKey) continue;
      if (all[key].name.trim() === target) return true;
    }
    return false;
  }

  static generateCollectionKey(): string {
    let key = new Date().getTime() + "";
    while (this.isCollection(key)) {
      key = Number(key) + 1 + "";
    }
    return key;
  }

  static createCollection(name: string, bookKeys: string[]): Collection | null {
    let targetName = (name || "").trim();
    if (!targetName) return null;
    if (this.isCollectionNameExists(targetName)) return null;
    this.getAllCollections();
    let key = this.generateCollectionKey();
    let collection = new Collection(key, targetName, []);
    this.cache![key] = collection;
    this.saveCollection(collection);
    if (bookKeys && bookKeys.length > 0) {
      this.addBooksToCollection(key, bookKeys);
    }
    return collection;
  }

  static updateCollection(key: string, name: string): boolean {
    let collection = this.getCollection(key);
    if (!collection) return false;
    let targetName = (name || "").trim();
    if (!targetName) return false;
    if (this.isCollectionNameExists(targetName, key)) return false;
    collection.name = targetName;
    this.saveCollection(collection);
    return true;
  }

  static addBooksToCollection(
    collectionKey: string,
    bookKeys: string[]
  ): { added: number; movedFrom: string[] } {
    let collection = this.getCollection(collectionKey);
    if (!collection) return { added: 0, movedFrom: [] };
    let all = this.getAllCollections();
    let movedFrom: string[] = [];
    let added = 0;
    for (let i = 0; i < bookKeys.length; i++) {
      let bookKey = bookKeys[i];
      if (!bookKey || this.isCollection(bookKey)) continue;
      for (let otherKey in all) {
        if (otherKey === collectionKey) continue;
        let other = all[otherKey];
        let index = other.books.indexOf(bookKey);
        if (index > -1) {
          other.books.splice(index, 1);
          this.saveCollection(other);
          if (movedFrom.indexOf(other.name) === -1) {
            movedFrom.push(other.name);
          }
        }
      }
      if (collection.books.indexOf(bookKey) === -1) {
        collection.books.push(bookKey);
        added++;
      }
    }
    this.saveCollection(collection);
    return { added, movedFrom };
  }

  static removeBooksFromCollection(
    collectionKey: string,
    bookKeys: string[]
  ): number {
    let collection = this.getCollection(collectionKey);
    if (!collection) return 0;
    let removed = 0;
    bookKeys.forEach((bookKey) => {
      let index = collection!.books.indexOf(bookKey);
      if (index > -1) {
        collection!.books.splice(index, 1);
        removed++;
      }
    });
    if (removed > 0) {
      this.saveCollection(collection);
    }
    return removed;
  }

  static removeBooksFromAllCollections(bookKeys: string[]): number {
    let all = this.getAllCollections();
    let keySet = new Set(bookKeys);
    let removed = 0;
    for (let key in all) {
      let collection = all[key];
      let originLength = collection.books.length;
      let filterBooks = collection.books.filter((bookKey) => {
        return !keySet.has(bookKey);
      });
      if (filterBooks.length !== originLength) {
        collection.books = filterBooks;
        removed += originLength - filterBooks.length;
        this.saveCollection(collection);
      }
    }
    return removed;
  }

  static dissolveCollection(collectionKey: string): boolean {
    let collection = this.getCollection(collectionKey);
    if (!collection) return false;
    ConfigService.deleteObjectConfig(collectionKey, "bookCollection");
    ConfigService.deleteListConfig(collectionKey, "favoriteBooks");
    ConfigService.deleteListConfig(collectionKey, "deletedBooks");
    ConfigService.deleteListConfig(collectionKey, "topBooks");
    ConfigService.deleteListConfig(collectionKey, "recentBooks");
    ConfigService.deleteFromAllMapConfig(collectionKey, "shelfList");
    ConfigService.deleteObjectConfig(collectionKey, "recordLocation");
    this.syncRawCache();
    if (this.cache) {
      delete this.cache[collectionKey];
    }
    this.bookMap = null;
    return true;
  }

  static getCollectionPercentageNumber(collection: Collection): number {
    if (!collection.books.length) return 0;
    let total = 0;
    collection.books.forEach((bookKey) => {
      let location = ConfigService.getObjectConfig(
        bookKey,
        "recordLocation",
        {}
      );
      let percentage = parseFloat(location?.percentage || "0");
      total += isNaN(percentage) ? 0 : percentage;
    });
    return total / collection.books.length;
  }

  static getCollectionPercentage(collection: Collection): string {
    if (!collection.books.length) return "";
    return this.getCollectionPercentageNumber(collection) + "";
  }

  static getCollectionReadingStatus(collection: Collection): string {
    if (!collection.books.length) return "unread";
    let finishedCount = 0;
    let readingCount = 0;
    collection.books.forEach((bookKey) => {
      let location = ConfigService.getObjectConfig(
        bookKey,
        "recordLocation",
        {}
      );
      let percentage = parseFloat(location?.percentage || "0");
      if (isNaN(percentage)) percentage = 0;
      if (percentage >= 1) {
        finishedCount++;
      } else if (percentage > 0) {
        readingCount++;
      }
    });
    if (finishedCount === collection.books.length) return "finished";
    if (finishedCount > 0 || readingCount > 0) return "reading";
    return "unread";
  }

  private static syncRawCache() {
    this.raw = ConfigService.getItem("bookCollection") || "{}";
  }

  private static saveCollection(collection: Collection) {
    ConfigService.setObjectConfig(
      collection.key,
      {
        key: collection.key,
        name: collection.name,
        books: collection.books,
      },
      "bookCollection"
    );
    this.syncRawCache();
    this.bookMap = null;
  }
}

export default CollectionUtil;
