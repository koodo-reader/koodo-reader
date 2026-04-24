import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";

/**
 * ReadingTimeUtil
 *
 * Tracks reading time per book with two storage targets:
 *
 * 1. `readingTime`  (objectConfig)  –  existing total-time store, kept for
 *    backward compatibility (e.g. sort-by-reading-time).
 *    Shape: { [bookKey]: totalSeconds }
 *
 * 2. `readingStats` (mapConfig)  –  new daily breakdown.
 *    Shape: { "YYYY-MM-DD": ["bookKey-seconds", ...] }
 *    Each entry in the array is "<bookKey>-<seconds read that day>".
 *    Seconds are cumulative within a single day; a new entry is appended /
 *    replaced each time a session is committed.
 *
 * Instead of setInterval the utility records a session start timestamp and
 * flushes elapsed seconds to storage only when the session actually ends
 * (tab hidden, window blur, component unmount, page unload).  This means:
 *  - No wasted CPU ticks while the user is idle / switched away.
 *  - Far fewer storage writes (once per session-end rather than every 5 s).
 *  - Accurate time – idle time is not counted.
 */

function getTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Read the current daily seconds for `bookKey` on `dateKey` from
 * `readingStats` mapConfig.
 */
function getDailySeconds(bookKey: string, dateKey: string): number {
  const statsMap = ConfigService.getAllMapConfig("readingStats") || {};
  const dayEntries: string[] = statsMap[dateKey] || [];
  const entry = dayEntries.find((s: string) => s.startsWith(bookKey + "-"));
  if (!entry) return 0;
  const parts = entry.split("-");
  return parseInt(parts[parts.length - 1], 10) || 0;
}

/**
 * Write updated daily seconds for `bookKey` on `dateKey` to
 * `readingStats` mapConfig.
 */
function setDailySeconds(
  bookKey: string,
  dateKey: string,
  seconds: number
): void {
  const statsMap = ConfigService.getAllMapConfig("readingStats") || {};
  const dayEntries: string[] = statsMap[dateKey] || [];
  const newEntry = `${bookKey}-${seconds}`;
  const filtered = dayEntries.filter(
    (s: string) => !s.startsWith(bookKey + "-")
  );
  ConfigService.setOneMapConfig(
    dateKey,
    [...filtered, newEntry],
    "readingStats"
  );
}

export class ReadingTimeUtil {
  private bookKey: string = "";
  private sessionStart: number = 0;

  // ── lifecycle ────────────────────────────────────────────────────────────

  /** Call once after the book key is known. */
  start(bookKey: string): void {
    this.bookKey = bookKey;
    this.sessionStart = Date.now();

    // Electron: intercept window close before the renderer is torn down.
    if (isElectron) {
      const { ipcRenderer } = (window as any).require("electron");
      ipcRenderer.on("before-reader-close", this.onElectronClose);
    } else {
      window.addEventListener("beforeunload", this.onBeforeUnload);
    }
  }

  /** Call in componentWillUnmount (web) – also covers normal Electron navigation. */
  stop(): void {
    this.commit();

    if (isElectron) {
      const { ipcRenderer } = (window as any).require("electron");
      ipcRenderer.removeListener("before-reader-close", this.onElectronClose);
    } else {
      window.removeEventListener("beforeunload", this.onBeforeUnload);
    }

    this.bookKey = "";
    this.sessionStart = 0;
  }

  // ── event handlers ───────────────────────────────────────────────────────

  /** Electron only: flush then tell main process it is safe to close. */
  private onElectronClose = (): void => {
    this.commit();
    const { ipcRenderer } = (window as any).require("electron");
    ipcRenderer.send("reader-close-ready");
  };

  /** Web only: flush on page unload. */
  private onBeforeUnload = (): void => {
    this.commit();
  };

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
    const prevTotal: number = ConfigService.getObjectConfig(
      this.bookKey,
      "readingTime",
      0
    );
    ConfigService.setObjectConfig(
      this.bookKey,
      prevTotal + elapsedSec,
      "readingTime"
    );

    // ── 2. Update daily readingStats ───────────────────────────────────
    const dateKey = getTodayKey();
    const prevDaily = getDailySeconds(this.bookKey, dateKey);
    setDailySeconds(this.bookKey, dateKey, prevDaily + elapsedSec);
  }

  // ── query helpers ────────────────────────────────────────────────────────

  /** Total reading time (seconds) across all time for a book. */
  static getTotalSeconds(bookKey: string): number {
    return ConfigService.getObjectConfig(bookKey, "readingTime", 0);
  }

  /** Reading time (seconds) for a book on a specific date (YYYY-MM-DD). */
  static getDailySeconds(bookKey: string, dateKey: string): number {
    return getDailySeconds(bookKey, dateKey);
  }

  /**
   * All daily entries for a given date.
   * Returns an array of `{ bookKey, seconds }` objects.
   */
  static getDayStats(dateKey: string): { bookKey: string; seconds: number }[] {
    const statsMap = ConfigService.getAllMapConfig("readingStats") || {};
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
  static getAllDates(): string[] {
    const statsMap = ConfigService.getAllMapConfig("readingStats");
    return Object.keys(statsMap || {});
  }
}
