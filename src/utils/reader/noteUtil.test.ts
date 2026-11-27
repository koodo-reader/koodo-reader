import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHighlight } from "./noteUtil";

const saveRecord = vi.fn();
const syncNote = vi.fn();

vi.stubGlobal("window", {});

vi.mock("../../assets/lib/kookit-extra-browser.min", () => ({
  ConfigService: {
    getObjectConfig: () => ({ percentage: "0.5" }),
  },
  NoteSyncManager: class {
    syncNote = syncNote;
  },
}));

vi.mock("../storage/databaseService", () => ({
  default: {
    saveRecord: (...args: any[]) => saveRecord(...args),
  },
}));

vi.mock("../common", () => ({
  isReadingRawPDF: () => false,
}));

const selectionText = vi.fn();
vi.mock("./docUtil", () => ({
  getIframeDoc: () => [
    {
      getSelection: () => ({ toString: selectionText }),
    },
  ],
}));

const createOneNote = vi.fn();

const params = () => ({
  currentBook: { key: "book-1", format: "EPUB" } as any,
  htmlBook: {
    rendition: {
      getHighlightCoords: async () => [],
      createOneNote,
    },
  } as any,
  chapterDocIndex: 0,
  chapter: "chapter-1",
  color: "background-#FEF3CD",
  t: (key: string) => key,
});

describe("createHighlight", () => {
  beforeEach(() => {
    saveRecord.mockReset();
    syncNote.mockReset();
    createOneNote.mockReset();
    selectionText.mockReset();
    selectionText.mockReturnValue("selected text");
  });

  it("writes one record when repeated clicks create highlights concurrently", async () => {
    let finishSaving: (value?: unknown) => void = () => {};
    saveRecord.mockReturnValue(
      new Promise((resolve) => {
        finishSaving = resolve;
      })
    );

    const first = createHighlight(params());
    const second = createHighlight(params());
    await Promise.resolve();
    finishSaving();
    await Promise.all([first, second]);

    expect(saveRecord).toHaveBeenCalledTimes(1);
    expect(createOneNote).toHaveBeenCalledTimes(1);
  });

  it("writes a record again once the previous one has been saved", async () => {
    saveRecord.mockResolvedValue(undefined);

    await createHighlight(params());
    await createHighlight(params());

    expect(saveRecord).toHaveBeenCalledTimes(2);
  });
});
