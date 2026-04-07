import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

declare var window: any;

interface ReadwiseSyncConfig {
  accessToken: string;
}

/**
 * Sync a note/highlight to Readwise.
 * Uses the Readwise Highlights API.
 */
export class ReadwiseSyncService {
  private static API_BASE = "https://readwise.io/api/v2";

  private static getConfig(): ReadwiseSyncConfig | null {
    try {
      const raw = ConfigService.getReaderConfig("readwiseSyncConfig");
      if (!raw) return null;
      return JSON.parse(raw) as ReadwiseSyncConfig;
    } catch {
      return null;
    }
  }

  static isEnabled(): boolean {
    return ConfigService.getReaderConfig("isEnableReadwiseSync") === "yes";
  }

  /**
   * Sync a single note/highlight to Readwise.
   * Readwise groups highlights by (title + author + source).
   */
  static async syncNote(
    note: any,
    bookName: string,
    author?: string
  ): Promise<boolean> {
    if (!this.isEnabled()) return false;

    const config = this.getConfig();
    if (!config) return false;

    const bookTitle = `${bookName}`;
    const isHighlight = !note.notes || note.notes.length === 0;

    const highlight: any = {
      text: note.text || "",
      title: bookTitle,
      author: author || "Unknown",
      source_type: "koodo-reader",
      category: "books",
      highlighted_at: `${note.date.year}-${String(note.date.month).padStart(2, "0")}-${String(note.date.day).padStart(2, "0")}`,
    };

    // If it's a note (has annotation), add it as a note to the highlight
    if (!isHighlight && note.notes) {
      highlight.note = note.notes;
    }

    // Add chapter info as location (must be an integer)
    if (note.chapter) {
      const chapterNum = parseInt(note.chapter, 10);
      if (!isNaN(chapterNum)) {
        highlight.location_type = "order";
        highlight.location = chapterNum;
      }
    }

    try {
      const response = await fetch(`${this.API_BASE}/highlights/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          highlights: [highlight],
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Readwise API error: ${response.status} ${response.statusText}`
        );
      }

      return true;
    } catch (error) {
      console.error("Readwise sync failed:", error);
      return false;
    }
  }
}
