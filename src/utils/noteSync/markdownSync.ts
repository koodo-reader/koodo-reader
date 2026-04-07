import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

declare var window: any;

interface MarkdownSyncConfig {
  "Markdown Sync Folder": string;
}

/**
 * Sync a note/highlight to a local Markdown file.
 * Each book gets its own file: "{Markdown Sync Folder}/{BookName}.md"
 * Notes/highlights are appended to the file.
 * Only available in Electron.
 */
export class MarkdownSyncService {
  private static getConfig(): MarkdownSyncConfig | null {
    try {
      const raw = ConfigService.getReaderConfig("markdownSyncConfig");
      if (!raw) return null;
      return JSON.parse(raw) as MarkdownSyncConfig;
    } catch {
      return null;
    }
  }

  static isEnabled(): boolean {
    return ConfigService.getReaderConfig("isEnableMarkdownSync") === "yes";
  }

  /**
   * Format a note/highlight as markdown text.
   */
  private static formatNoteMarkdown(note: any): string {
    const isHighlight = !note.notes || note.notes.length === 0;
    const dateStr = `${note.date.year}-${String(note.date.month).padStart(2, "0")}-${String(note.date.day).padStart(2, "0")}`;

    let md = "\n---\n\n";

    if (note.chapter) {
      md += `### ${note.chapter}\n\n`;
    }

    md += `> ${note.text || ""}\n\n`;

    if (!isHighlight && note.notes) {
      md += `📝 ${note.notes}\n\n`;
    }

    md += `*Added on ${dateStr}*\n\n`;

    return md;
  }

  /**
   * Sanitize a book name so it can be used as a file name.
   */
  private static sanitizeFileName(name: string): string {
    return name.replace(/[\\/:*?"<>|]/g, "_").trim();
  }

  /**
   * Sync a single note/highlight to the local markdown file.
   */
  static async syncNote(
    note: any,
    bookName: string,
    author?: string
  ): Promise<boolean> {
    if (!this.isEnabled()) return false;

    const config = this.getConfig();
    if (!config) return false;

    const folder = config["Markdown Sync Folder"];
    if (!folder) return false;

    try {
      const fs = window.require("fs");
      const path = window.require("path");

      const safeBookName = this.sanitizeFileName(bookName);
      const filePath = path.join(folder, `${safeBookName}.md`);

      // If file doesn't exist, create with header
      if (!fs.existsSync(filePath)) {
        const header = `# ${bookName}\n`;
        const authorLine = author ? `**Author:** ${author}\n\n` : "\n";
        fs.writeFileSync(filePath, header + authorLine, "utf-8");
      }

      // Append the note/highlight
      const content = this.formatNoteMarkdown(note);
      fs.appendFileSync(filePath, content, "utf-8");

      return true;
    } catch (error) {
      console.error("Markdown sync failed:", error);
      return false;
    }
  }
}
