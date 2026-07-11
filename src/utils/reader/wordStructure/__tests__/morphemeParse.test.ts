/**
 * @jest-environment jsdom
 */

import { describe, expect, test } from "@jest/globals";
import { buildMorphemeBreakdown } from "../morphemeParse";
import { NestRow } from "../nestPack";

function row(
  word: string,
  parent = "",
  affix = "",
  type = "",
  pos = ""
): NestRow {
  return { word, root: "", parent, affix, type, pos };
}

const asPairs = (segments: ReturnType<typeof buildMorphemeBreakdown>) =>
  segments!.map((s) => `${s.role}:${s.text}`);

describe("buildMorphemeBreakdown (разбор слова по составу)", () => {
  test("распознавать → рас|по|зна|ва|ть", () => {
    const chain = [
      row("знать"),
      row("познать", "знать", "по", "prefix", "V"),
      row("распознать", "познать", "рас", "prefix", "V"),
      row("распознавать", "распознать", "вать", "suffix", "V"),
    ];
    expect(asPairs(buildMorphemeBreakdown(chain, "распознавать"))).toEqual([
      "prefix:рас",
      "prefix:по",
      "root:зна",
      "suffix:ва",
      "ending:ть",
    ]);
  });

  test("знание → зна|ни|е", () => {
    const chain = [row("знать"), row("знание", "знать", "ание", "suffix", "N")];
    expect(asPairs(buildMorphemeBreakdown(chain, "знание"))).toEqual([
      "root:зна",
      "suffix:ни",
      "ending:е",
    ]);
  });

  test("переводчик → перевод|чик|□ (zero ending)", () => {
    const chain = [
      row("перевод"),
      row("переводчик", "перевод", "чик", "suffix", "N"),
    ];
    expect(asPairs(buildMorphemeBreakdown(chain, "переводчик"))).toEqual([
      "root:перевод",
      "suffix:чик",
      "ending:",
    ]);
  });

  test("писатель → писа|тель (ь stays in the suffix)", () => {
    const chain = [
      row("писать"),
      row("писатель", "писать", "тель", "suffix", "N"),
    ];
    expect(asPairs(buildMorphemeBreakdown(chain, "писатель"))).toEqual([
      "root:писа",
      "suffix:тель",
    ]);
  });

  test("признаться → при|зна|ть|ся (postfix)", () => {
    const chain = [
      row("знать"),
      row("признать", "знать", "при", "prefix", "V"),
      row("признаться", "признать", "ся", "suffix", "V"),
    ];
    expect(asPairs(buildMorphemeBreakdown(chain, "признаться"))).toEqual([
      "prefix:при",
      "root:зна",
      "ending:ть",
      "postfix:ся",
    ]);
  });

  test("root-only verb знать → зна|ть", () => {
    expect(asPairs(buildMorphemeBreakdown([row("знать")], "знать"))).toEqual([
      "root:зна",
      "ending:ть",
    ]);
  });

  test("adjective переводческий → перевод|ческ|ий", () => {
    const chain = [
      row("перевод"),
      row("переводческий", "перевод", "ческий", "suffix", "J"),
    ];
    expect(asPairs(buildMorphemeBreakdown(chain, "переводческий"))).toEqual([
      "root:перевод",
      "suffix:ческ",
      "ending:ий",
    ]);
  });

  test("absorbs consonant alternations into the root: снежный → снеж|н|ый", () => {
    const chain = [
      row("снег"),
      row("снежный", "снег", "ный", "suffix", "J"),
    ];
    expect(asPairs(buildMorphemeBreakdown(chain, "снежный"))).toEqual([
      "root:снеж",
      "suffix:н",
      "ending:ый",
    ]);
  });

  test("книжка → книж|к|а (г→ж alternation)", () => {
    const chain = [row("книга"), row("книжка", "книга", "ка", "suffix", "N")];
    expect(asPairs(buildMorphemeBreakdown(chain, "книжка"))).toEqual([
      "root:книж",
      "suffix:к",
      "ending:а",
    ]);
  });

  test("returns null when the root cannot be located", () => {
    const chain = [row("бежать"), row("бег", "бежать", "", "suffix", "N")];
    expect(buildMorphemeBreakdown(chain, "бег")).toBeNull();
  });

  describe("English profile", () => {
    const EN = {
      verbEndings: [],
      adjEndings: [],
      nounVowelEndings: "",
      softFinal: "",
      alternations: { y: "i" },
      absorbDoubling: true,
      postfixes: [],
    };

    test("unbelievable → un|believ|able (e-drop via root shortening)", () => {
      const chain = [
        row("believe"),
        row("believable", "believe", "able", "suffix", "J"),
        row("unbelievable", "believable", "un", "prefix", "J"),
      ];
      expect(asPairs(buildMorphemeBreakdown(chain, "unbelievable", EN))).toEqual([
        "prefix:un",
        "root:believ",
        "suffix:able",
      ]);
    });

    test("runner → runn|er (consonant doubling absorbed)", () => {
      const chain = [row("run"), row("runner", "run", "er", "suffix", "N")];
      expect(asPairs(buildMorphemeBreakdown(chain, "runner", EN))).toEqual([
        "root:runn",
        "suffix:er",
      ]);
    });

    test("happiness → happi|ness (y→i alternation)", () => {
      const chain = [
        row("happy"),
        row("happiness", "happy", "ness", "suffix", "N"),
      ];
      expect(asPairs(buildMorphemeBreakdown(chain, "happiness", EN))).toEqual([
        "root:happi",
        "suffix:ness",
      ]);
    });

    test("no zero-ending box for English consonant-final nouns", () => {
      const chain = [
        row("nation"),
        row("national", "nation", "al", "suffix", "J"),
      ];
      const segments = buildMorphemeBreakdown(chain, "national", EN)!;
      expect(segments.some((s) => s.role === "ending")).toBe(false);
    });
  });
});
