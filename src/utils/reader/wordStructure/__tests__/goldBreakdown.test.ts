/**
 * @jest-environment jsdom
 *
 * Hermetic gold-standard audit of the morpheme-breakdown pipeline
 * (dictionary layer first, chain synthesis as fallback) against
 * school-canonical разбор по составу answers.
 *
 * The fixture mini-pack under fixtures/packs/ is extracted from the real
 * generated ru pack (see scripts/buildWordStructurePack.mjs) and contains the
 * full derivation chains + морфо-ru dictionary rows for every gold word, so
 * this test exercises production data content without the 36 MB pack.
 */

import { beforeAll, describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { TextDecoder, TextEncoder } from "util";

(global as any).TextEncoder = (global as any).TextEncoder || TextEncoder;
(global as any).TextDecoder = (global as any).TextDecoder || TextDecoder;

import {
  ensureNestPackLoaded,
  lookupWordStructure,
  getDictionaryBreakdown,
  __resetNestPackForTesting,
} from "../nestPack";
import { buildMorphemeBreakdown, RU_BREAKDOWN } from "../morphemeParse";

const FIXTURE_DIR = `${__dirname}/fixtures/packs`;

type Verdict = "exact" | "divergent" | "missing";

/**
 * word, school-canonical breakdown, pipeline output (pinned), verdict.
 * "divergent" rows are editorial-depth differences inherited from the data
 * sources (Tikhonov-style fused roots in ru.wiktionary, unanalyzed pages),
 * documented deliberately — a change in either direction should be noticed.
 */
const GOLD: Array<[string, string, string | null, Verdict]> = [
  ["учитель", "уч-и-тель", "учи-тель", "divergent"], // wiktionary page unanalyzed; synthesis uses verb stem
  ["ученик", "уч-е-ник", "уч-е-ник", "exact"],
  ["писатель", "пис-а-тель", "пис-а-тель", "exact"],
  ["переписывать", "пере-пис-ыва-ть", "пере-пис-ыва-ть", "exact"],
  ["записка", "за-пис-к-а", "за-пис-к-а", "exact"],
  ["водный", "вод-н-ый", "вод-н-ый", "exact"],
  ["подводный", "под-вод-н-ый", "под-вод-н-ый", "exact"],
  ["знание", "зна-ни-е", "зна-ни-е", "exact"],
  ["признать", "при-зна-ть", "призна-ть", "divergent"], // dictionary fuses при- (Tikhonov synchronic analysis)
  ["распознавать", "рас-по-зна-ва-ть", "рас-по-зна-ва-ть", "exact"],
  ["читатель", "чит-а-тель", "чит-а-тель", "exact"],
  ["перечитать", "пере-чит-а-ть", "пере-чит-а-ть", "exact"],
  ["лесной", "лес-н-ой", "лес-н-ой", "exact"],
  ["переводчик", "пере-вод-чик", "пере-вод-чик", "exact"],
  ["рассказ", "рас-сказ", "рас-сказ", "exact"],
  ["подарок", "по-дар-ок", "по-дар-ок", "exact"],
  ["бегун", "бег-ун", "бег-ун", "exact"],
  ["побег", "по-бег", "по-бег", "exact"],
  ["снежный", "снеж-н-ый", "снеж-н-ый", "exact"],
  ["книжка", "книж-к-а", "книж-к-а", "exact"],
  ["домик", "дом-ик", "дом-ик", "exact"],
  ["столик", "стол-ик", "стол-ик", "exact"],
  ["работник", "работ-ник", "работ-ник", "exact"],
  ["заработать", "за-работ-а-ть", "за-раб-от-а-ть", "divergent"], // dictionary uses deep root раб
  ["узнать", "у-зна-ть", "у-зна-ть", "exact"],
  ["подснежник", "под-снеж-ник", null, "missing"], // absent from MorphyNet+DerivBase vocabulary
  ["безводный", "без-вод-н-ый", "без-вод-н-ый", "exact"],
  ["перелесок", "пере-лес-ок", "пере-лес-ок", "exact"],
  ["городской", "город-ск-ой", "город-ск-ой", "exact"],
  ["морской", "мор-ск-ой", "мор-ск-ой", "exact"],
  ["холодный", "холод-н-ый", "холод-н-ый", "exact"],
  ["дождливый", "дожд-лив-ый", "дожд-лив-ый", "exact"],
  ["звёздный", "звёзд-н-ый", "звёзд-н-ый", "exact"],
  ["грибник", "гриб-ник", "гриб-ник", "exact"],
  ["садовник", "сад-ов-ник", "сад-ов-ник", "exact"],
  ["цветок", "цвет-ок", "цвет-ок", "exact"],
  ["тракторист", "трактор-ист", "трактор-ист", "exact"],
  ["футболист", "футбол-ист", "футбол-ист", "exact"],
  ["учительница", "уч-и-тель-ниц-а", "уч-и-тель-ниц-а", "exact"],
  ["водитель", "вод-и-тель", "вод-и-тель", "exact"],
];

const MIN_EXACT = 36;

function breakdownOf(word: string): string | null {
  const result = lookupWordStructure(word, "ru");
  if (!result) return null;
  const morphemes =
    getDictionaryBreakdown(result.lemma, "ru") ||
    buildMorphemeBreakdown(result.chain, result.lemma, RU_BREAKDOWN);
  if (!morphemes) return null;
  return morphemes
    .filter((m) => m.text)
    .map((m) => m.text)
    .join("-");
}

describe("gold-standard разбор по составу audit (hermetic fixture)", () => {
  beforeAll(async () => {
    __resetNestPackForTesting();
    (global as any).fetch = (url: any) => {
      const u = String(url);
      const file = u.includes("nests")
        ? "ru-gold.nests.tsv"
        : u.includes("morphemes")
          ? "ru-gold.morphemes.tsv"
          : "ru-gold.forms.tsv";
      const body = readFileSync(`${FIXTURE_DIR}/${file}`, "utf-8");
      return Promise.resolve({
        ok: true,
        status: 200,
        arrayBuffer: () =>
          Promise.resolve(new TextEncoder().encode(body).buffer),
      });
    };
    await ensureNestPackLoaded({
      lang: "ru",
      packVersion: "gold-fixture",
      packBaseUrl: "fixtures/packs",
      files: {
        nests: "ru-gold.nests.tsv",
        forms: "ru-gold.forms.tsv",
        morphemes: "ru-gold.morphemes.tsv",
      },
    });
  });

  test.each(GOLD)("%s → %s", (word, school, pinned, verdict) => {
    const ours = breakdownOf(word);
    expect(ours).toBe(pinned);
    if (verdict === "exact") {
      expect(ours).toBe(school);
    }
  });

  test(`school-exact count stays at or above ${MIN_EXACT}/${GOLD.length}`, () => {
    let exact = 0;
    for (const [word, school] of GOLD) {
      if (breakdownOf(word) === school) exact += 1;
    }
    expect(exact).toBeGreaterThanOrEqual(MIN_EXACT);
  });
});
