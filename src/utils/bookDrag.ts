import { ConfigService } from "../assets/lib/kookit-extra-browser.min";

export const BOOK_DRAG_TYPE = "application/x-koodo-book";

export function setBookDragData(
  e: React.DragEvent,
  bookKeys: string[]
): void {
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
