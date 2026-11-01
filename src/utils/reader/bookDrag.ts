import { ConfigService, CollectionUtil } from "../../assets/lib/kookit-extra-browser.min";
import i18n from "../../i18n";

const collectionUtil = new CollectionUtil(ConfigService);

export const BOOK_DRAG_TYPE = "application/x-koodo-book";

export function filterNonCollectionKeys(bookKeys: string[]): string[] {
  return bookKeys.filter((key) => key && !collectionUtil.isCollection(key));
}

export function getMovedFromSuffix(movedFrom: string[]): string {
  if (!movedFrom || movedFrom.length === 0) return "";
  return (
    " (" + i18n.t("Moved from collection") + ": " + movedFrom.join(", ") + ")"
  );
}

export function setBookDragData(e: React.DragEvent, bookKeys: string[]): void {
  if (!e.dataTransfer) return;
  e.dataTransfer.setData(BOOK_DRAG_TYPE, JSON.stringify(bookKeys));
  e.dataTransfer.effectAllowed = "copy";
}

export function parseBookDragData(e: React.DragEvent | DragEvent): string[] {
  if (!e.dataTransfer) return [];
  const raw = e.dataTransfer.getData(BOOK_DRAG_TYPE);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [raw];
  } catch {
    return [raw];
  }
}

export function isBookDragEvent(e: React.DragEvent | DragEvent): boolean {
  if (!e.dataTransfer) return false;
  return Array.from(e.dataTransfer.types).includes(BOOK_DRAG_TYPE);
}

export function isExternalFileDragEvent(
  e: React.DragEvent | DragEvent
): boolean {
  if (!e.dataTransfer) return false;
  if (isBookDragEvent(e)) return false;
  const types = Array.from(e.dataTransfer.types);
  if (!types.includes("Files")) return false;
  // Internal image drags (e.g. cover) carry html/uri-list alongside Files
  if (types.includes("text/html") || types.includes("text/uri-list")) {
    return false;
  }
  return true;
}

export function addBooksToShelf(
  bookKeys: string[],
  shelfTitle: string
): number {
  const shelfList = ConfigService.getAllMapConfig("shelfList");
  const existing = new Set<string>(shelfList[shelfTitle] || []);
  let added = 0;
  for (const key of bookKeys) {
    if (existing.has(key)) continue;
    ConfigService.setMapConfig(shelfTitle, key, "shelfList");
    existing.add(key);
    added++;
  }
  return added;
}

export function addBooksToFavorite(bookKeys: string[]): number {
  const existing = new Set<string>(
    ConfigService.getAllListConfig("favoriteBooks")
  );
  const deleted = new Set<string>(
    ConfigService.getAllListConfig("deletedBooks")
  );
  let added = 0;
  for (const key of bookKeys) {
    if (existing.has(key)) continue;
    ConfigService.setListConfig(key, "favoriteBooks");
    if (deleted.has(key)) {
      ConfigService.deleteListConfig(key, "deletedBooks");
    }
    existing.add(key);
    added++;
  }
  return added;
}

export function moveBooksToTrash(bookKeys: string[]): number {
  const existing = new Set<string>(
    ConfigService.getAllListConfig("deletedBooks")
  );
  let moved = 0;
  for (const key of bookKeys) {
    if (existing.has(key)) continue;
    ConfigService.setListConfig(key, "deletedBooks");
    ConfigService.deleteListConfig(key, "favoriteBooks");
    existing.add(key);
    moved++;
  }
  let bookOnlyKeys = filterNonCollectionKeys(bookKeys);
  if (bookOnlyKeys.length > 0) {
    collectionUtil.removeBooksFromAllCollections(bookOnlyKeys);
  }
  return moved;
}
