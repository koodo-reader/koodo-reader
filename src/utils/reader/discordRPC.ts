import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import BookModel from "../../models/Book";

declare var window: any;

/**
 * Update Discord Rich Presence with the current book info.
 * Only works in Electron and when isEnableDiscordRPC is set to "yes".
 */
export function updateDiscordPresence(book: BookModel): void {
  if (!isDiscordRPCEnabled()) return;
  if (!book || !book.key) return;

  const percentage = getBookPercentage(book.key);

  try {
    const { ipcRenderer } = window.require("electron");
    ipcRenderer.invoke("discord-rpc-update", {
      bookTitle: book.name || "Unknown title",
      author: book.author || "Unknown author",
      percentage,
    });
  } catch (e) {
    console.warn("Failed to update Discord RPC:", e);
  }
}

/**
 * Clear Discord Rich Presence (e.g. when the reader is closed).
 * Only works in Electron and when isEnableDiscordRPC is set to "yes".
 */
export function clearDiscordPresence(): void {
  if (!isDiscordRPCEnabled()) return;

  try {
    const { ipcRenderer } = window.require("electron");
    ipcRenderer.invoke("discord-rpc-clear");
  } catch (e) {
    console.warn("Failed to clear Discord RPC:", e);
  }
}

function isDiscordRPCEnabled(): boolean {
  try {
    if (!window || !window.require) return false;
    return ConfigService.getReaderConfig("isEnableDiscordRPC") === "yes";
  } catch {
    return false;
  }
}

function getBookPercentage(bookKey: string): number {
  try {
    const location = ConfigService.getObjectConfig(
      bookKey,
      "recordLocation",
      {}
    );
    if (location && location.percentage != null) {
      return Math.round(parseFloat(location.percentage) * 100);
    }
  } catch {
    // ignore
  }
  return 0;
}
