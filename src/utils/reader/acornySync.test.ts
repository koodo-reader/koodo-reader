import {
  buildAcornyHighlight,
  syncNoteToAcorny,
} from "./acornySync";

declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

const sampleNote = {
  text: "Call me Ishmael.",
  notes: "favorite opening line",
  chapter: "12",
  date: { year: 2026, month: 5, day: 31 },
};

describe("acornySync", () => {
  const createEnabledConfig = () => ({
    getReaderConfig: jest.fn((key: string) =>
      key === "isEnableAcornySync" ? "yes" : ""
    ),
    getObjectConfig: jest.fn(() => ({
      accessToken: "acorny-token",
    })),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds a Readwise-compatible highlight for Acorny", () => {
    expect(
      buildAcornyHighlight(sampleNote, "Moby Dick", "Herman Melville")
    ).toEqual({
      text: "Call me Ishmael.",
      title: "Moby Dick",
      author: "Herman Melville",
      source_type: "koodo-reader",
      category: "books",
      highlighted_at: "2026-05-31",
      note: "favorite opening line",
      location_type: "order",
      location: 12,
    });
  });

  it("posts enabled notes to Acorny's Readwise-compatible endpoint", async () => {
    const fetcher = jest.fn().mockResolvedValue({ ok: true });
    const enabledConfig = createEnabledConfig();

    await expect(
      syncNoteToAcorny(
        sampleNote,
        "Moby Dick",
        "Herman Melville",
        enabledConfig,
        fetcher
      )
    ).resolves.toBe(true);

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.acorny.io/api/v2/highlights/",
      {
        method: "POST",
        headers: {
          Authorization: "Token acorny-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          highlights: [
            buildAcornyHighlight(sampleNote, "Moby Dick", "Herman Melville"),
          ],
        }),
      }
    );
  });

  it("does not post when Acorny sync is disabled", async () => {
    const fetcher = jest.fn();
    const config = {
      getReaderConfig: jest.fn(() => "no"),
      getObjectConfig: jest.fn(),
    };

    await expect(
      syncNoteToAcorny(sampleNote, "Moby Dick", "", config, fetcher)
    ).resolves.toBe(false);

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns false when Acorny rejects the request", async () => {
    const fetcher = jest.fn().mockResolvedValue({ ok: false, status: 401 });
    const enabledConfig = createEnabledConfig();
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    await expect(
      syncNoteToAcorny(sampleNote, "Moby Dick", "", enabledConfig, fetcher)
    ).resolves.toBe(false);

    consoleError.mockRestore();
  });
});
