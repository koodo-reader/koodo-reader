/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, test } from "@jest/globals";
import { TextDecoder, TextEncoder } from "util";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeCrypto = require("crypto");
// jsdom lacks these browser natives
(global as any).TextEncoder = (global as any).TextEncoder || TextEncoder;
(global as any).TextDecoder = (global as any).TextDecoder || TextDecoder;
if (!(global as any).crypto?.subtle) {
  Object.defineProperty(global, "crypto", { value: nodeCrypto.webcrypto });
}
import {
  ensureNestPackLoaded,
  lookupWordStructure,
  getGloss,
  getGlossLangs,
  getDictionaryBreakdown,
  addNestPackListener,
  NestPackProgress,
  __resetNestPackForTesting,
} from "../nestPack";
import { WordStructurePluginConfig } from "../wordStructurePlugin";

const RU_NESTS = [
  "# header",
  "знать\tзнать\t\t\t\t",
  "знание\tзнать\tзнать\tание\tsuffix\tN",
  "признать\tзнать\tзнать\tпри\tprefix\tV",
  "признание\tзнать\tпризнать\tание\tsuffix\tN",
  "ёж\tёж\t\t\t\t",
  "ёжик\tёж\tёж\tик\tsuffix\tN",
].join("\n");

const RU_FORMS = [
  "# header",
  "знанием\tзнание",
  "признания\tпризнание",
  "ежика\tёжик",
].join("\n");

const RU_GLOSSES = ["# header", "знать\tknow\twissen", "знание\tknowledge\tKenntnis"].join(
  "\n"
);

const RU_MORPHEMES = [
  "# header",
  "признание\tпри:prefix|зна:root|ни:suffix|е:ending",
  "водопровод\tвод:root|о:interfix|про:prefix|вод:root",
  "знаться\tзна:root|ть:ending|ся:postfix",
  "битый\tбит:badrole|ый:ending", // invalid role — line must be skipped
  "рваный", // no tab payload — skipped
].join("\n");

const EN_NESTS = [
  "# header",
  "believe\tbelieve\t\t\t\t",
  "believable\tbelieve\tbelieve\table\tsuffix\tJ",
  "unbelievable\tbelieve\tbelievable\tun\tprefix\tJ",
].join("\n");

const EN_FORMS = ["# header", "believed\tbelieve"].join("\n");

const RU_CONFIG: WordStructurePluginConfig = {
  lang: "ru",
  packVersion: "test",
  packBaseUrl: "assets/word-structure",
  files: {
    nests: "ru.nests.tsv",
    forms: "ru.forms.tsv",
    glosses: "ru.glosses.tsv",
    morphemes: "ru.morphemes.tsv",
  },
  glossLangs: ["en", "de"],
};

const EN_CONFIG: WordStructurePluginConfig = {
  lang: "en",
  packVersion: "test",
  packBaseUrl: "assets/word-structure",
  files: { nests: "en.nests.tsv", forms: "en.forms.tsv" },
};

function mockFetch() {
  (global as any).fetch = (url: any) => {
    const u = String(url);
    const body = u.includes("ru.nests")
      ? RU_NESTS
      : u.includes("ru.forms")
        ? RU_FORMS
        : u.includes("ru.glosses")
          ? RU_GLOSSES
          : u.includes("ru.morphemes")
            ? RU_MORPHEMES
            : u.includes("en.nests")
              ? EN_NESTS
              : EN_FORMS;
    return Promise.resolve({
      ok: true,
      status: 200,
      arrayBuffer: () =>
        Promise.resolve(new TextEncoder().encode(body).buffer),
    });
  };
}

describe("nestPack (multi-language registry)", () => {
  beforeEach(() => {
    __resetNestPackForTesting();
    mockFetch();
  });

  test("resolves an inflected Russian form to lemma, chain and nest tree", async () => {
    await ensureNestPackLoaded(RU_CONFIG);
    const result = lookupWordStructure("знанием", "ru");
    expect(result).not.toBeNull();
    expect(result!.lemma).toBe("знание");
    expect(result!.root).toBe("знать");
    expect(result!.chain.map((s) => s.word)).toEqual(["знать", "знание"]);
    expect(result!.memberCount).toBe(4);
  });

  test("multi-step chain reaches the nest root", async () => {
    await ensureNestPackLoaded(RU_CONFIG);
    expect(
      lookupWordStructure("признания", "ru")!.chain.map((s) => s.word)
    ).toEqual(["знать", "признать", "признание"]);
  });

  test("citation forms and ё-variants resolve without a forms row", async () => {
    await ensureNestPackLoaded(RU_CONFIG);
    expect(lookupWordStructure("Признать", "ru")!.lemma).toBe("признать");
    expect(lookupWordStructure("ежик", "ru")!.lemma).toBe("ёжик");
  });

  test("glosses respect the requested gloss language", async () => {
    await ensureNestPackLoaded(RU_CONFIG);
    expect(getGlossLangs("ru")).toEqual(["en", "de"]);
    expect(getGloss("знать", "ru", "en")).toBe("know");
    expect(getGloss("знать", "ru", "de")).toBe("wissen");
    expect(getGloss("собака", "ru", "en")).toBeNull();
  });

  test("two language packs coexist independently", async () => {
    await ensureNestPackLoaded(RU_CONFIG);
    await ensureNestPackLoaded(EN_CONFIG);
    expect(lookupWordStructure("unbelievable", "en")!.chain.map((s) => s.word)).toEqual([
      "believe",
      "believable",
      "unbelievable",
    ]);
    expect(lookupWordStructure("знанием", "ru")!.lemma).toBe("знание");
    // ru token in en pack and vice versa miss cleanly
    expect(lookupWordStructure("знанием", "en")).toBeNull();
    expect(lookupWordStructure("unbelievable", "ru")).toBeNull();
  });

  test("checksum mismatch rejects the pack", async () => {
    const bad: WordStructurePluginConfig = {
      ...RU_CONFIG,
      sha256: { nests: "00".repeat(32) },
    };
    await expect(ensureNestPackLoaded(bad)).rejects.toThrow(/checksum/);
  });

  test("returns null for unknown words and unloaded languages", async () => {
    await ensureNestPackLoaded(RU_CONFIG);
    expect(lookupWordStructure("собака", "ru")).toBeNull();
    expect(lookupWordStructure("hello", "en")).toBeNull();
    expect(lookupWordStructure("", "ru")).toBeNull();
  });

  test("dictionary morpheme layer parses roles incl. interfix and postfix", async () => {
    await ensureNestPackLoaded(RU_CONFIG);
    expect(getDictionaryBreakdown("Признание", "ru")).toEqual([
      { text: "при", role: "prefix" },
      { text: "зна", role: "root" },
      { text: "ни", role: "suffix" },
      { text: "е", role: "ending" },
    ]);
    expect(
      getDictionaryBreakdown("водопровод", "ru")!.map((m) => m.role)
    ).toEqual(["root", "interfix", "prefix", "root"]);
    expect(
      getDictionaryBreakdown("знаться", "ru")!.map((m) => m.role)
    ).toEqual(["root", "ending", "postfix"]);
    // malformed rows are skipped, not partially parsed
    expect(getDictionaryBreakdown("битый", "ru")).toBeNull();
    expect(getDictionaryBreakdown("рваный", "ru")).toBeNull();
    expect(getDictionaryBreakdown("знание", "ru")).toBeNull();
  });

  test("gloss falls back to the first column for unknown gloss languages", async () => {
    await ensureNestPackLoaded(RU_CONFIG);
    expect(getGloss("знать", "ru", "fr")).toBe("know");
    expect(getGloss("знать", "ru")).toBe("know");
  });

  test("emits downloading → parsing → ready progress for the language", async () => {
    const phases: NestPackProgress[] = [];
    const remove = addNestPackListener((p) => phases.push(p));
    await ensureNestPackLoaded(RU_CONFIG);
    remove();
    expect(phases.map((p) => p.phase)).toEqual([
      "downloading",
      "parsing",
      "ready",
    ]);
    expect(phases.every((p) => p.lang === "ru")).toBe(true);
  });

  test("a second load call reuses the in-flight/completed promise", async () => {
    let fetchCount = 0;
    const original = (global as any).fetch;
    (global as any).fetch = (url: any) => {
      fetchCount += 1;
      return original(url);
    };
    await Promise.all([
      ensureNestPackLoaded(RU_CONFIG),
      ensureNestPackLoaded(RU_CONFIG),
    ]);
    await ensureNestPackLoaded(RU_CONFIG);
    expect(fetchCount).toBe(4); // nests + forms + glosses + morphemes, once
  });

  test("a failed load can be retried after the cause is fixed", async () => {
    (global as any).fetch = () =>
      Promise.resolve({ ok: false, status: 503, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) });
    await expect(ensureNestPackLoaded(RU_CONFIG)).rejects.toThrow(/503/);
    expect(lookupWordStructure("знать", "ru")).toBeNull();
    mockFetch();
    await ensureNestPackLoaded(RU_CONFIG);
    expect(lookupWordStructure("знать", "ru")!.lemma).toBe("знать");
  });

  test("retry after a mid-parse failure does not duplicate nest members", async () => {
    // nests succeed, forms fail: the nests map is half-filled before the throw
    const bodyFor = (u: string) =>
      u.includes("ru.nests") ? RU_NESTS : u.includes("ru.glosses") ? RU_GLOSSES : RU_MORPHEMES;
    let failForms = true;
    (global as any).fetch = (url: any) => {
      const u = String(url);
      if (u.includes("ru.forms")) {
        return failForms
          ? Promise.resolve({ ok: false, status: 500, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) })
          : Promise.resolve({ ok: true, status: 200, arrayBuffer: () => Promise.resolve(new TextEncoder().encode(RU_FORMS).buffer) });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode(bodyFor(u)).buffer),
      });
    };
    await expect(ensureNestPackLoaded(RU_CONFIG)).rejects.toThrow(/500/);
    failForms = false;
    await ensureNestPackLoaded(RU_CONFIG);
    // знать's nest keeps exactly its 4 members, not doubled by the retry
    expect(lookupWordStructure("знание", "ru")!.memberCount).toBe(4);
    expect(lookupWordStructure("знание", "ru")!.tree.children).toHaveLength(2);
  });
});
