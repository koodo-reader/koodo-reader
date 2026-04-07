import { NotionSyncService } from "./notionSync";
import { YuqueSyncService } from "./yuqueSync";
import { ReadwiseSyncService } from "./readwiseSync";
import { MarkdownSyncService } from "./markdownSync";
import DatabaseService from "../storage/databaseService";
import toast from "react-hot-toast";

/**
 * NoteSyncManager coordinates syncing notes/highlights to all enabled destinations.
 * Call syncNote() after a note or highlight is created/updated.
 * It will automatically check which destinations are enabled and sync to each.
 */
export class NoteSyncManager {
  /**
   * Sync a note/highlight to all enabled destinations.
   * @param note - The Note object (from Note model)
   * @param bookKey - The book's key to look up book name
   */
  static async syncNote(note: any, bookKey?: string): Promise<void> {
    const enabledServices: Array<{
      name: string;
      sync: (note: any, bookName: string, author?: string) => Promise<boolean>;
    }> = [];

    if (NotionSyncService.isEnabled()) {
      enabledServices.push({
        name: "Notion",
        sync: NotionSyncService.syncNote.bind(NotionSyncService),
      });
    }

    if (YuqueSyncService.isEnabled()) {
      enabledServices.push({
        name: "Yuque",
        sync: YuqueSyncService.syncNote.bind(YuqueSyncService),
      });
    }

    if (ReadwiseSyncService.isEnabled()) {
      enabledServices.push({
        name: "Readwise",
        sync: ReadwiseSyncService.syncNote.bind(ReadwiseSyncService),
      });
    }

    if (MarkdownSyncService.isEnabled()) {
      enabledServices.push({
        name: "Markdown",
        sync: MarkdownSyncService.syncNote.bind(MarkdownSyncService),
      });
    }

    if (enabledServices.length === 0) return;

    // Resolve book name from bookKey
    let bookName = "Unknown Book";
    let author = "";
    if (bookKey || note.bookKey) {
      try {
        const book = await DatabaseService.getRecord(
          bookKey || note.bookKey,
          "books"
        );
        if (book && book.name) {
          bookName = book.name;
        }
        if (book && book.author) {
          author = book.author;
        }
      } catch {
        // Book not found, use default name
      }
    }

    // Sync to all enabled destinations in parallel
    const results = await Promise.allSettled(
      enabledServices.map(async (service) => {
        try {
          const success = await service.sync(note, bookName, author);
          return { name: service.name, success };
        } catch (error) {
          console.error(`${service.name} sync error:`, error);
          return { name: service.name, success: false };
        }
      })
    );

    // Report failures
    const failures = results
      .filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && !r.value.success)
      )
      .map((r) => (r.status === "fulfilled" ? r.value.name : "Unknown"));

    if (failures.length > 0) {
      toast.error(`Sync failed for: ${failures.join(", ")}`);
    }
  }
}
