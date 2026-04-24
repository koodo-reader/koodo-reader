/**
 * Platform hooks injected at construction time.
 * - `registerUnloadHandler`   – subscribe to the "about to close/unload" event;
 *   should call the provided callback and return an unsubscribe function.
 * - `onBeforeClose` (optional) – called after commit in the unload handler so
 *   the platform can perform any additional teardown (e.g. `ipcRenderer.send`).
 */
export interface IReadingTimePlatform {
  registerUnloadHandler(callback: () => void): () => void;
  onBeforeClose?: () => void;
}

function getTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export class ReadingTimeUtil {
  private bookKey: string = "";
  private sessionStart: number = 0;
  private unregisterUnload: (() => void) | null = null;

  private readonly configService: any;
  private readonly platform: IReadingTimePlatform;

  constructor(configService: any, platform: IReadingTimePlatform) {
    this.configService = configService;
    this.platform = platform;
  }

  // ── private storage helpers ──────────────────────────────────────────────

  private getDailySeconds(bookKey: string, dateKey: string): number {
    const statsMap = this.configService.getAllMapConfig("readingStats") || {};
    const dayEntries: string[] = statsMap[dateKey] || [];
    const entry = dayEntries.find((s: string) => s.startsWith(bookKey + "-"));
    if (!entry) return 0;
    const parts = entry.split("-");
    return parseInt(parts[parts.length - 1], 10) || 0;
  }

  private setDailySeconds(
    bookKey: string,
    dateKey: string,
    seconds: number
  ): void {
    const statsMap = this.configService.getAllMapConfig("readingStats") || {};
    const dayEntries: string[] = statsMap[dateKey] || [];
    const newEntry = `${bookKey}-${seconds}`;
    const filtered = dayEntries.filter(
      (s: string) => !s.startsWith(bookKey + "-")
    );
    this.configService.setOneMapConfig(
      dateKey,
      [...filtered, newEntry],
      "readingStats"
    );
  }

  // ── lifecycle ────────────────────────────────────────────────────────────

  /** Call once after the book key is known. */
  start(bookKey: string): void {
    this.bookKey = bookKey;
    this.sessionStart = Date.now();
    this.unregisterUnload = this.platform.registerUnloadHandler(() => {
      this.commit();
      this.platform.onBeforeClose?.();
    });
  }

  /** Call in componentWillUnmount – also covers normal Electron navigation. */
  stop(): void {
    this.commit();
    this.unregisterUnload?.();
    this.unregisterUnload = null;
    this.bookKey = "";
    this.sessionStart = 0;
  }

  // ── core logic ───────────────────────────────────────────────────────────

  /**
   * Flush elapsed seconds since the last session start to both storage
   * targets.  Safe to call multiple times (idempotent when sessionStart = 0).
   */
  commit(): void {
    if (!this.bookKey || !this.sessionStart) return;

    const elapsedMs = Date.now() - this.sessionStart;
    if (elapsedMs < 1000) {
      // Ignore sub-second blips (e.g. rapid focus/blur)
      this.sessionStart = 0;
      return;
    }
    const elapsedSec = Math.round(elapsedMs / 1000);
    this.sessionStart = 0; // mark as flushed

    // ── 1. Update total readingTime (backward compat) ──────────────────
    const prevTotal: number = this.configService.getObjectConfig(
      this.bookKey,
      "readingTime",
      0
    );
    this.configService.setObjectConfig(
      this.bookKey,
      prevTotal + elapsedSec,
      "readingTime"
    );

    // ── 2. Update daily readingStats ───────────────────────────────────
    const dateKey = getTodayKey();
    const prevDaily = this.getDailySeconds(this.bookKey, dateKey);
    this.setDailySeconds(this.bookKey, dateKey, prevDaily + elapsedSec);
  }

  // ── instance query helpers ───────────────────────────────────────────────

  /** Total reading time (seconds) across all time for a book. */
  getTotalSeconds(bookKey: string): number {
    return this.configService.getObjectConfig(bookKey, "readingTime", 0);
  }

  /** Reading time (seconds) for a book on a specific date (YYYY-MM-DD). */
  getDailySecondsForBook(bookKey: string, dateKey: string): number {
    return this.getDailySeconds(bookKey, dateKey);
  }

  /**
   * All daily entries for a given date.
   * Returns an array of `{ bookKey, seconds }` objects.
   */
  getDayStats(dateKey: string): { bookKey: string; seconds: number }[] {
    const statsMap = this.configService.getAllMapConfig("readingStats") || {};
    const dayEntries: string[] = statsMap[dateKey] || [];
    return dayEntries.map((entry: string) => {
      const dashIdx = entry.lastIndexOf("-");
      return {
        bookKey: entry.substring(0, dashIdx),
        seconds: parseInt(entry.substring(dashIdx + 1), 10) || 0,
      };
    });
  }

  /**
   * All dates that have reading stats recorded.
   * Returns an array of date strings (YYYY-MM-DD).
   */
  getAllDates(): string[] {
    const statsMap = this.configService.getAllMapConfig("readingStats");
    return Object.keys(statsMap || {});
  }
}
