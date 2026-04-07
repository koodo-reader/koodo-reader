import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

declare var window: any;

interface NotionSyncConfig {
  token: string;
  databaseId: string;
}

/**
 * Sync a note/highlight to Notion.
 * Each book is represented as a page in a Notion database.
 * All notes/highlights for the same book are appended as blocks within the same page.
 * Page title: "{bookName}"
 */
export class NotionSyncService {
  private static getConfig(): NotionSyncConfig | null {
    try {
      const raw = ConfigService.getReaderConfig("notionSyncConfig");
      if (!raw) return null;
      return JSON.parse(raw) as NotionSyncConfig;
    } catch {
      return null;
    }
  }

  static isEnabled(): boolean {
    return ConfigService.getReaderConfig("isEnableNotionSync") === "yes";
  }

  /**
   * If the given ID is a page (not a database), search its children for a database
   * and return the first database ID found.
   */
  private static async resolveDatabaseId(
    token: string,
    pageId: string
  ): Promise<string> {
    const response = await fetch(
      `https://api.notion.com/v1/blocks/${pageId}/children`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Notion resolve database error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const dbBlock = (data.results || []).find(
      (block: any) => block.type === "child_database"
    );

    if (!dbBlock) {
      throw new Error(
        `No child database found in page ${pageId}. Please provide a Database ID directly.`
      );
    }

    return dbBlock.id;
  }

  /**
   * Find an existing page for this book in the Notion database, or create one.
   */
  private static async findOrCreatePage(
    token: string,
    databaseId: string,
    bookName: string
  ): Promise<string> {
    const pageTitle = `${bookName}`;

    // Search for existing page
    const searchResponse = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          filter: {
            property: "title",
            title: {
              equals: pageTitle,
            },
          },
        }),
      }
    );

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      // If the ID is actually a page, resolve the real database ID from its children
      if (
        searchResponse.status === 400 &&
        errorData?.code === "validation_error" &&
        typeof errorData?.message === "string" &&
        errorData.message.includes("is a page, not a database")
      ) {
        const resolvedDatabaseId = await this.resolveDatabaseId(
          token,
          databaseId
        );
        return this.findOrCreatePage(token, resolvedDatabaseId, bookName);
      }
      throw new Error(
        `Notion API error: ${searchResponse.status} ${searchResponse.statusText}`
      );
    }

    const searchData = await searchResponse.json();

    if (searchData.results && searchData.results.length > 0) {
      return searchData.results[0].id;
    }

    // Create new page
    const createResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: pageTitle,
                },
              },
            ],
          },
        },
      }),
    });

    if (!createResponse.ok) {
      throw new Error(
        `Notion create page error: ${createResponse.status} ${createResponse.statusText}`
      );
    }

    const createData = await createResponse.json();
    return createData.id;
  }

  /**
   * Append a note/highlight as blocks to the page.
   */
  private static async appendBlocks(
    token: string,
    pageId: string,
    note: any,
    chapter: string
  ): Promise<void> {
    const isHighlight = !note.notes || note.notes.length === 0;
    const blocks: any[] = [];

    // Divider
    blocks.push({ object: "block", type: "divider", divider: {} });

    // Chapter heading
    if (chapter) {
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: chapter } }],
        },
      });
    }

    // Highlighted text as quote
    blocks.push({
      object: "block",
      type: "quote",
      quote: {
        rich_text: [
          {
            type: "text",
            text: { content: note.text || "" },
          },
        ],
      },
    });

    // If it's a note (has annotation), add the note text
    if (!isHighlight && note.notes) {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: { content: `📝 ${note.notes}` },
            },
          ],
        },
      });
    }

    // Timestamp
    const dateStr = `${note.date.year}-${String(note.date.month).padStart(2, "0")}-${String(note.date.day).padStart(2, "0")}`;
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: { content: `Added on ${dateStr}` },
            annotations: { italic: true, color: "gray" },
          },
        ],
      },
    });

    const response = await fetch(
      `https://api.notion.com/v1/blocks/${pageId}/children`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({ children: blocks }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Notion append blocks error: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * Sync a single note/highlight to Notion.
   */
  static async syncNote(note: any, bookName: string): Promise<boolean> {
    if (!this.isEnabled()) return false;

    const config = this.getConfig();
    if (!config) return false;

    try {
      const pageId = await this.findOrCreatePage(
        config.token,
        config.databaseId,
        bookName
      );

      await this.appendBlocks(config.token, pageId, note, note.chapter || "");

      return true;
    } catch (error) {
      console.error("Notion sync failed:", error);
      return false;
    }
  }
}
