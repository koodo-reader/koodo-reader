/**
 * @jest-environment jsdom
 */

import { describe, expect, test } from "@jest/globals";
import {
  getLanguageProfile,
  guessTokenLanguage,
} from "../languageProfiles";
import { WordStructurePluginConfig } from "../wordStructurePlugin";

describe("languageProfiles", () => {
  test("Russian profile: school notation, stress/ё normalization", () => {
    const profile = getLanguageProfile("ru");
    expect(profile.notation).toBe("ru-school");
    expect(profile.roleLabels.root).toBe("корень");
    expect(profile.normalizeKey("Зна́ние")).toBe("знание");
    expect(profile.normalizeKey("Ёжик")).toBe("ежик");
    expect(profile.breakdown.verbEndings).toContain("ть");
    expect("распознавать".match(profile.tokenPattern)![0]).toBe(
      "распознавать"
    );
  });

  test("English profile: hyphen notation, doubling absorption", () => {
    const profile = getLanguageProfile("en");
    expect(profile.notation).toBe("hyphen");
    expect(profile.roleLabels.root).toBe("root");
    expect(profile.breakdown.absorbDoubling).toBe(true);
    expect(profile.breakdown.alternations).toEqual({ y: "i" });
    expect(profile.normalizeKey("Don’t")).toBe("don't");
    expect("unbelievable!".match(profile.tokenPattern)![0]).toBe(
      "unbelievable"
    );
  });

  test("unknown language falls back to a generic profile with that lang", () => {
    const profile = getLanguageProfile("de");
    expect(profile.lang).toBe("de");
    expect(profile.notation).toBe("hyphen");
    expect(profile.breakdown.verbEndings).toEqual([]);
    expect("Donaudampfschiff".match(profile.tokenPattern)![0]).toBe(
      "Donaudampfschiff"
    );
  });

  test("plugin config overrides merge over the base profile", () => {
    const config: WordStructurePluginConfig = {
      lang: "ru",
      packVersion: "1",
      packBaseUrl: "x",
      files: { nests: "n", forms: "f" },
      notation: "hyphen",
      profile: { postfixes: ["ся"] },
      roleLabels: { root: "основа-корень" },
    };
    const profile = getLanguageProfile("ru", config);
    expect(profile.notation).toBe("hyphen");
    expect(profile.breakdown.postfixes).toEqual(["ся"]);
    // untouched parts of the base profile survive the merge
    expect(profile.breakdown.verbEndings).toContain("ть");
    expect(profile.roleLabels.root).toBe("основа-корень");
    expect(profile.roleLabels.prefix).toBe("приставка");
  });

  test("guessTokenLanguage routes by script", () => {
    expect(guessTokenLanguage("знание")).toBe("ru");
    expect(guessTokenLanguage("«Пере́водчик»")).toBe("ru");
    expect(guessTokenLanguage("unbelievable")).toBe("en");
    expect(guessTokenLanguage("123 …")).toBe("");
  });
});
