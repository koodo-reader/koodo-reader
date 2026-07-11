/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const mockConfigStore: Record<string, any> = {};
jest.mock("../../../../assets/lib/kookit-extra-browser.min", () => ({
  ConfigService: {
    getObjectConfig: (key: string, configKey: string, fallback: any) =>
      mockConfigStore[`${configKey}:${key}`] ?? fallback,
    setObjectConfig: (key: string, value: any, configKey: string) => {
      mockConfigStore[`${configKey}:${key}`] = value;
    },
  },
}));

import {
  detectLanguageFromText,
  getCachedBookLanguage,
  detectAndCacheBookLanguage,
} from "../bookLanguage";

const RU_TEXT =
  "Переводчик перечитал перевод ещё раз. Он знал, что знание языка не заменит понимания.";
const EN_TEXT =
  "The translator reread the translation once more, and every reader of the book was with him in that moment.";
const DE_TEXT =
  "Der Übersetzer las die Übersetzung noch einmal, und das Buch war nicht mit ihm fertig, denn die Wörter und der Sinn...";
const FR_TEXT =
  "Le traducteur relisait la traduction et les mots restaient dans une lumière que le livre est seul à donner des pages.";

function makeDoc(text: string): Document {
  const doc = document.implementation.createHTMLDocument("t");
  doc.body.textContent = text;
  return doc;
}

describe("bookLanguage", () => {
  beforeEach(() => {
    for (const key of Object.keys(mockConfigStore)) {
      delete mockConfigStore[key];
    }
  });

  test("detects language from text by script and stopwords", () => {
    expect(detectLanguageFromText(RU_TEXT)).toBe("ru");
    expect(detectLanguageFromText(EN_TEXT)).toBe("en");
    expect(detectLanguageFromText(DE_TEXT)).toBe("de");
    expect(detectLanguageFromText(FR_TEXT)).toBe("fr");
    expect(detectLanguageFromText("12345 !!! …")).toBe("");
  });

  test("caches the detection per book key", () => {
    expect(getCachedBookLanguage("book-1")).toBe("");
    expect(detectAndCacheBookLanguage("book-1", makeDoc(DE_TEXT))).toBe("de");
    expect(getCachedBookLanguage("book-1")).toBe("de");
    // subsequent calls return the cache even if the page content differs
    expect(detectAndCacheBookLanguage("book-1", makeDoc(EN_TEXT))).toBe("de");
  });

  test("missing document or empty text detects nothing and caches nothing", () => {
    expect(detectAndCacheBookLanguage("book-2", null)).toBe("");
    expect(getCachedBookLanguage("book-2")).toBe("");
  });
});
