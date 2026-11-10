import { afterAll, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import dictReaderModule from "./dict-reader";

// The main-process dictionary module is plain CommonJS JavaScript.
const dictReader: any = dictReaderModule;

const {
  _internal,
  importDictionaryBundles,
  importDictionaryBuffer,
  lookupDictionary,
  migrateDictionaries,
  removeDictionary,
  clearDictCache,
} = dictReader;

const tempDirs: string[] = [];

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "koodo-dict-"));
  tempDirs.push(dir);
  return dir;
};

const u32 = (value: number) => {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value, 0);
  return buffer;
};

const buildMdxHeader = (attrs: string) => {
  const xml = Buffer.from(`<Dictionary ${attrs}/>`, "utf16le");
  return Buffer.concat([u32(xml.length), xml]);
};

const buildStarDict = (word: string, definition: string) => {
  const body = Buffer.from(definition, "utf8");
  const idx = Buffer.concat([
    Buffer.from(`${word}\0`, "utf8"),
    u32(0),
    u32(body.length),
  ]);
  const ifo = Buffer.from(
    [
      "StarDict's dict ifo file",
      "version=2.4.2",
      "wordcount=1",
      `idxfilesize=${idx.length}`,
      "bookname=Test Dictionary",
      "sametypesequence=m",
      "",
    ].join("\n"),
    "utf8"
  );
  return { ifo, idx, dict: body };
};

afterAll(async () => {
  clearDictCache();
  for (const dir of tempDirs) {
    await rm(dir, { recursive: true, force: true });
  }
});

describe("dictionary helper functions", () => {
  it("builds de-duplicated lookup candidates", () => {
    const candidates = _internal.buildLookupCandidates("  Hello!  ");
    expect(candidates).toContain("Hello!");
    expect(candidates).toContain("hello");
    expect(new Set(candidates).size).toBe(candidates.length);
  });

  it("parses StarDict ifo files", () => {
    const ifo = _internal.parseIfo(
      "StarDict's dict ifo file\nversion=2.4.2\nbookname=Demo\n"
    );
    expect(ifo.bookname).toBe("Demo");
    expect(ifo.version).toBe("2.4.2");
  });

  it("decodes DICT base64 numbers", () => {
    expect(_internal.decodeDictBase64("A")).toBe(0);
    expect(_internal.decodeDictBase64("B")).toBe(1);
    expect(_internal.decodeDictBase64("AQ")).toBe(16);
    expect(_internal.decodeDictBase64("AAE")).toBe(4);
  });

  it("parses DICT index entries", () => {
    const parsed = _internal.parseDictIndex("hello\tAA\tAK\n");
    expect(parsed.words).toEqual(["hello"]);
    expect(Array.from(parsed.entries)).toEqual([0, 10]);
  });

  it("splits single and multi type StarDict entries", () => {
    const single = _internal.parseStarDictFields(
      Buffer.from("definition", "utf8"),
      "m"
    );
    expect(single).toHaveLength(1);
    expect(single[0].type).toBe("m");
    expect(single[0].data.toString("utf8")).toBe("definition");

    const multi = _internal.parseStarDictFields(
      Buffer.from("term\0definition", "utf8"),
      "tm"
    );
    expect(multi.map((field: any) => field.type)).toEqual(["t", "m"]);
    expect(multi[0].data.toString("utf8")).toBe("term");
    expect(multi[1].data.toString("utf8")).toBe("definition");
  });

  it("recognizes dictzip dictionary files", () => {
    const file = _internal.classifyFile("C:\\dicts\\My Dict.dict.dz");
    expect(file.isDictZip).toBe(true);
    expect(file.stem).toBe("my dict");
    expect(file.extension).toBe("dz");
  });

  it("groups StarDict companion files under one stem", () => {
    const { bundles, orphans } = _internal.groupBundlesByStem([
      "C:\\dicts\\demo.ifo",
      "C:\\dicts\\demo.idx",
      "C:\\dicts\\demo.dict.dz",
      "C:\\dicts\\demo.syn",
    ]);
    expect(orphans).toHaveLength(0);
    expect(bundles).toHaveLength(1);
    expect(bundles[0].kind).toBe("stardict");
    expect(bundles[0].dict.isDictZip).toBe(true);
  });
});

describe("MDict encryption handling", () => {
  const describeMdx = async (encrypted: string) => {
    const dir = await makeTempDir();
    await writeFile(
      path.join(dir, "demo.mdx"),
      buildMdxHeader(
        `Title="Demo" Format="Html" Encrypted="${encrypted}"`
      )
    );
    return _internal.describeBundle(
      {
        kind: "mdict",
        stem: "demo",
        mdx: { name: "demo.mdx" },
        mdd: [],
        css: [],
      },
      dir
    );
  };

  it("treats Encrypted=2 as supported", async () => {
    const meta = await describeMdx("2");
    expect(meta.name).toBe("Demo");
    expect(meta.unsupported).toBeUndefined();
  });

  it("flags Encrypted=1 as unsupported", async () => {
    const meta = await describeMdx("1");
    expect(meta.unsupported).toBe(true);
    expect(meta.unsupportedReason).toBe("mdict-encrypted");
  });
});

describe("StarDict import and lookup", () => {
  it("imports a bundle into its own directory and looks it up", async () => {
    const storage = await makeTempDir();
    const source = await makeTempDir();
    const files = buildStarDict("hello", "a greeting");

    await writeFile(path.join(source, "demo.ifo"), files.ifo);
    await writeFile(path.join(source, "demo.idx"), files.idx);
    await writeFile(path.join(source, "demo.dict"), files.dict);

    const result = await importDictionaryBundles(storage, [
      path.join(source, "demo.ifo"),
      path.join(source, "demo.idx"),
      path.join(source, "demo.dict"),
    ]);

    expect(result.ok).toBe(true);
    expect(result.imported).toHaveLength(1);
    const dict = result.imported[0];
    expect(dict.kind).toBe("stardict");
    expect(dict.name).toBe("Test Dictionary");
    expect(dict.files).toMatchObject({
      ifo: "demo.ifo",
      idx: "demo.idx",
      dict: "demo.dict",
    });

    const lookup = await lookupDictionary({
      storagePath: storage,
      dictId: dict.id,
      word: "hello",
    });
    expect(lookup.ok).toBe(true);
    expect(lookup.content).toBe("a greeting");

    const missing = await lookupDictionary({
      storagePath: storage,
      dictId: dict.id,
      word: "unknown",
    });
    expect(missing).toMatchObject({ ok: false, reason: "not-found" });

    const remove = await removeDictionary(storage, dict.id);
    expect(remove.ok).toBe(true);
  });
});

describe("buffer import", () => {
  it("writes a downloaded dictionary into its own directory", async () => {
    const storage = await makeTempDir();
    const result = await importDictionaryBuffer(storage, {
      id: "buffer-123",
      name: "Buffer Dictionary",
      extension: "mdx",
      buffer: Buffer.from("not a real mdx file", "utf8"),
    });

    expect(result.ok).toBe(true);
    expect(result.dict).toMatchObject({
      id: "buffer-123",
      name: "Buffer Dictionary",
      kind: "mdict",
      files: { mdx: "buffer-123.mdx", mdd: [], css: [] },
    });
    // A malformed MDX is stored but flagged instead of crashing the import.
    expect(result.dict.unsupported).toBe(true);

    const remove = await removeDictionary(storage, "buffer-123");
    expect(remove.ok).toBe(true);
  });
});

describe("legacy dictionary migration", () => {
  it("moves loose files into a timestamp directory", async () => {
    const storage = await makeTempDir();
    const dictRoot = path.join(storage, "dict");
    await mkdir(dictRoot, { recursive: true });
    const files = buildStarDict("legacy", "migrated definition");

    await writeFile(path.join(dictRoot, "123.ifo"), files.ifo);
    await writeFile(path.join(dictRoot, "123.idx"), files.idx);
    await writeFile(path.join(dictRoot, "123.dict"), files.dict);

    const result = await migrateDictionaries(storage, [
      { id: "123", name: "Legacy" },
    ]);

    expect(result.removedIds).toEqual([]);
    expect(result.migrated).toHaveLength(1);
    expect(result.migrated[0]).toMatchObject({
      id: "123",
      kind: "stardict",
      name: "Legacy",
    });

    const lookup = await lookupDictionary({
      storagePath: storage,
      dictId: "123",
      word: "legacy",
    });
    expect(lookup.ok).toBe(true);
    expect(lookup.content).toBe("migrated definition");
  });

  it("drops records whose files are gone", async () => {
    const storage = await makeTempDir();
    const result = await migrateDictionaries(storage, [
      { id: "999", name: "Missing" },
    ]);
    expect(result.migrated).toEqual([]);
    expect(result.removedIds).toEqual(["999"]);
  });
});
