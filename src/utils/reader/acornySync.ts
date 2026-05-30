type ConfigServiceLike = {
  getReaderConfig: (key: string) => string | null | undefined;
  getObjectConfig: (
    key: string,
    category: string,
    defaultValue: Record<string, any>
  ) => Record<string, any>;
};

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<{ ok: boolean; status?: number; statusText?: string }>;

type KoodoNote = {
  text?: string;
  notes?: string;
  chapter?: string;
  date?: { year: number; month: number; day: number };
};

const ACORNY_HIGHLIGHTS_URL = "https://api.acorny.io/api/v2/highlights/";

const formatDate = (date?: KoodoNote["date"]) => {
  const safeDate =
    date ||
    ({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    } as NonNullable<KoodoNote["date"]>);

  return `${safeDate.year}-${String(safeDate.month).padStart(2, "0")}-${String(
    safeDate.day
  ).padStart(2, "0")}`;
};

export const buildAcornyHighlight = (
  note: KoodoNote,
  title: string,
  author?: string
) => {
  const highlight: Record<string, any> = {
    text: note.text || "",
    title: title || "Unknown Book",
    author: author || "Unknown",
    source_type: "koodo-reader",
    category: "books",
    highlighted_at: formatDate(note.date),
  };

  if (note.notes) {
    highlight.note = note.notes;
  }

  if (note.chapter) {
    const location = parseInt(note.chapter, 10);
    if (!Number.isNaN(location)) {
      highlight.location_type = "order";
      highlight.location = location;
    }
  }

  return highlight;
};

export const syncNoteToAcorny = async (
  note: KoodoNote,
  title: string,
  author: string,
  configService: ConfigServiceLike,
  fetcher: Fetcher = fetch
) => {
  if (configService.getReaderConfig("isEnableAcornySync") !== "yes") {
    return false;
  }

  const config = configService.getObjectConfig(
    "acornySyncConfig",
    "thirdpartyToken",
    {}
  );
  const accessToken = config.accessToken;
  if (!accessToken) {
    return false;
  }

  try {
    const response = await fetcher(ACORNY_HIGHLIGHTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        highlights: [buildAcornyHighlight(note, title, author)],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Acorny API error: ${response.status || ""} ${
          response.statusText || ""
        }`.trim()
      );
    }

    return true;
  } catch (error) {
    console.error("Acorny sync failed:", error);
    return false;
  }
};
