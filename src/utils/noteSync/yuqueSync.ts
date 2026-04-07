import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

declare var window: any;

interface YuqueSyncConfig {
  token: string;
  namespace: string;
}

/**
 * Sync a note/highlight to Yuque (语雀).
 * Each book is represented as a document in a Yuque repository.
 * Notes/highlights are appended to the document body.
 */
export class YuqueSyncService {
  private static API_BASE = "https://www.yuque.com/api/v2";

  private static getConfig(): YuqueSyncConfig | null {
    try {
      const raw = ConfigService.getReaderConfig("yuqueSyncConfig");
      if (!raw) return null;
      return JSON.parse(raw) as YuqueSyncConfig;
    } catch {
      return null;
    }
  }

  static isEnabled(): boolean {
    return ConfigService.getReaderConfig("isEnableYuqueSync") === "yes";
  }

  /**
   * Find an existing document for this book, or create one.
   */
  private static async findOrCreateDoc(
    token: string,
    namespace: string,
    bookName: string
  ): Promise<{ id: number; slug: string; body: string }> {
    const docTitle = `${bookName}`;
    const slug = `koodo-reader-${bookName
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .substring(0, 50)}`;

    // Try to get existing document by slug
    try {
      const getResponse = await fetch(
        `${this.API_BASE}/repos/${namespace}/docs/${slug}`,
        {
          method: "GET",
          headers: {
            "X-Auth-Token": token,
            "Content-Type": "application/json",
          },
        }
      );

      if (getResponse.ok) {
        const getData = await getResponse.json();
        return {
          id: getData.data.id,
          slug: getData.data.slug,
          body: getData.data.body || "",
        };
      }
    } catch {
      // Document doesn't exist, create it
    }

    // Create new document
    const createResponse = await fetch(
      `${this.API_BASE}/repos/${namespace}/docs`,
      {
        method: "POST",
        headers: {
          "X-Auth-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: docTitle,
          slug: slug,
          body: `# ${docTitle}\n\n`,
          format: "markdown",
        }),
      }
    );

    if (!createResponse.ok) {
      throw new Error(
        `Yuque create doc error: ${createResponse.status} ${createResponse.statusText}`
      );
    }

    const createData = await createResponse.json();
    return {
      id: createData.data.id,
      slug: createData.data.slug,
      body: createData.data.body || "",
    };
  }

  /**
   * Append a note/highlight to the document body.
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
   * Update the document with the new content appended.
   */
  private static async updateDoc(
    token: string,
    namespace: string,
    docId: number,
    body: string
  ): Promise<void> {
    const response = await fetch(
      `${this.API_BASE}/repos/${namespace}/docs/${docId}`,
      {
        method: "PUT",
        headers: {
          "X-Auth-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: body,
          format: "markdown",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Yuque update doc error: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * Sync a single note/highlight to Yuque.
   */
  static async syncNote(note: any, bookName: string): Promise<boolean> {
    if (!this.isEnabled()) return false;

    const config = this.getConfig();
    if (!config) return false;

    try {
      const doc = await this.findOrCreateDoc(
        config.token,
        config.namespace,
        bookName
      );

      const newContent = this.formatNoteMarkdown(note);
      const updatedBody = doc.body + newContent;

      await this.updateDoc(config.token, config.namespace, doc.id, updatedBody);

      return true;
    } catch (error) {
      console.error("Yuque sync failed:", error);
      return false;
    }
  }
}
