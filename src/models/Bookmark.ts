// Use crypto.randomUUID for globally unique key generation instead of timestamp
const generateBookmarkKey = (): string => {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

class Bookmark {
  readonly key: string;
  readonly bookKey: string;
  readonly cfi: string;
  readonly label: string;
  readonly percentage: string;
  readonly chapter: string;
  constructor(
    bookKey: string,
    cfi: string,
    label: string,
    percentage: string,
    chapter: string
  ) {
    this.key = generateBookmarkKey();
    this.bookKey = bookKey;
    this.cfi = cfi;
    this.label = label;
    this.percentage = percentage;
    this.chapter = chapter;
  }
}

export default Bookmark;
