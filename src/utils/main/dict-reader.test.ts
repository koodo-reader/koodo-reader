import { afterAll, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { gzipSync } from "fflate";
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

const u16 = (value: number) => {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16BE(value, 0);
  return buffer;
};

const u64 = (value: number) => {
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(value / 2 ** 32), 0);
  buffer.writeUInt32BE(value >>> 0, 4);
  return buffer;
};

/** Builds a minimal MDict 2.0 file (UTF-8, stored) with one key block per group. */
const buildMdx = (groups: { key: string; definition: string }[][]) => {
  const blocks: { key: string; start: number }[][] = [];
  const recordParts: Buffer[] = [];
  let recordOffset = 0;

  for (const group of groups) {
    const keys: { key: string; start: number }[] = [];
    for (const entry of group) {
      const data = Buffer.from(entry.definition, "utf8");
      keys.push({ key: entry.key, start: recordOffset });
      recordOffset += data.length;
      recordParts.push(data);
    }
    blocks.push(keys);
  }
  const recordData = Buffer.concat(recordParts);

  // Each key block holds [compression type][adler32][offset + key + NUL]...
  const keyBlockBuffers = blocks.map((keys) => {
    const parts: Buffer[] = [];
    for (const item of keys) {
      parts.push(u64(item.start), Buffer.from(item.key, "utf8"), Buffer.from([0]));
    }
    return Buffer.concat([u32(0), u32(0), Buffer.concat(parts)]);
  });
  const keyBlocks = Buffer.concat(keyBlockBuffers);

  const infoParts: Buffer[] = [];
  blocks.forEach((keys, index) => {
    const first = Buffer.from(keys[0].key, "utf8");
    const last = Buffer.from(keys[keys.length - 1].key, "utf8");
    infoParts.push(
      u64(keys.length),
      u16(first.length),
      Buffer.concat([first, Buffer.from([0])]),
      u16(last.length),
      Buffer.concat([last, Buffer.from([0])]),
      u64(keyBlockBuffers[index].length),
      u64(keyBlockBuffers[index].length - 8)
    );
  });
  const keyInfo = Buffer.concat(infoParts);

  const xml = Buffer.from(
    '<Dictionary Title="Test MDX" GeneratedByEngineVersion="2.0" RequiredEngineVersion="2.0" Encrypted="No" Encoding="UTF-8" Format="Html"/>',
    "utf16le"
  );
  const header = Buffer.concat([u32(xml.length), xml, u32(0)]);

  const entriesCount = blocks.reduce((sum, keys) => sum + keys.length, 0);
  const keyHeader = Buffer.concat([
    u64(blocks.length),
    u64(entriesCount),
    u64(keyInfo.length),
    u64(keyInfo.length),
    u64(keyBlocks.length),
    u32(0),
  ]);

  const recordBlock = Buffer.concat([u32(0), u32(0), recordData]);
  const recordInfo = Buffer.concat([
    u64(recordBlock.length),
    u64(recordData.length),
  ]);
  const recordHeader = Buffer.concat([
    u64(1),
    u64(entriesCount),
    u64(recordInfo.length),
    u64(recordBlock.length),
  ]);

  return Buffer.concat([
    header,
    keyHeader,
    keyInfo,
    keyBlocks,
    recordHeader,
    recordInfo,
    recordBlock,
  ]);
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

  it("recognizes a gzipped StarDict index", () => {
    const file = _internal.classifyFile("C:\\dicts\\demo.idx.gz");
    expect(file.isIdxGzip).toBe(true);
    expect(file.stem).toBe("demo");
    expect(file.extension).toBe("gz");
  });

  it("groups a StarDict bundle whose index is gzipped", () => {
    const { bundles, orphans } = _internal.groupBundlesByStem([
      "C:\\dicts\\demo.ifo",
      "C:\\dicts\\demo.idx.gz",
      "C:\\dicts\\demo.dict.dz",
    ]);
    expect(orphans).toHaveLength(0);
    expect(bundles).toHaveLength(1);
    expect(bundles[0].kind).toBe("stardict");
    expect(bundles[0].idx.name).toBe("demo.idx.gz");
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

describe("Slob lzma2 decompression", () => {
  it("decodes a raw lzma2 payload", async () => {
    const payload = Buffer.from(
      "4AbfADxdACWb7MhvEA/jcaN74U1eJSfPnOvb9qf23pG+a1wb4dgd0QNiqaCRPHX8++U9nnCe4KC7/tFprsomdJTUAAA=",
      "base64"
    );
    const raw = await _internal.unlzma2(payload);
    expect(raw.toString("utf8")).toBe(
      "Koodo Reader Slob lzma2 regression payload. ".repeat(40)
    );
  });

  it("decodes a payload larger than 512 KB in one pass", async () => {
    const payload = Buffer.from(
      "7DT/AONdACWb7MhvEA/jcaN74U1eJSfPnOvb9qf23pG+a1wb4dgd0QNiqaCRPHX8++U9nnCe4KC7/tFprsoqxbw91zlezH6TcOe1l+ErSXguU2SCfnDKpRiW8My9P4Gr+76N2mOImQmpiQ7RBGHN0kjyD/OlfNwmyLCLsmkYYOw5gCoEF8KykO27dUTQdElcxG2ykuegyM4HBO6f3qVCy4g/XACP0E6vJiiUcR89jyThcJ6nI1/sKMuF0ZWYin4qkfIndfcZwAaYTZj92K/VkA/EJVP49ZE2MQWlsO5vwXBNRwzRkOLhSBAAAA==",
      "base64"
    );
    const raw = await _internal.unlzma2(payload);
    const text = "Koodo Reader Slob lzma2 regression payload. ".repeat(20000);
    expect(raw).toHaveLength(800000);
    expect(raw.toString("utf8")).toBe(text.slice(0, 800000));
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

  it("imports and looks up a bundle with a gzipped index", async () => {
    const storage = await makeTempDir();
    const source = await makeTempDir();
    const files = buildStarDict("hello", "a greeting");

    await writeFile(path.join(source, "demo.ifo"), files.ifo);
    await writeFile(path.join(source, "demo.idx.gz"), gzipSync(files.idx));
    await writeFile(path.join(source, "demo.dict"), files.dict);

    const result = await importDictionaryBundles(storage, [
      path.join(source, "demo.ifo"),
      path.join(source, "demo.idx.gz"),
      path.join(source, "demo.dict"),
    ]);

    expect(result.ok).toBe(true);
    expect(result.imported).toHaveLength(1);
    const dict = result.imported[0];
    expect(dict.kind).toBe("stardict");
    expect(dict.files).toMatchObject({
      ifo: "demo.ifo",
      idx: "demo.idx.gz",
      dict: "demo.dict",
    });

    const lookup = await lookupDictionary({
      storagePath: storage,
      dictId: dict.id,
      word: "hello",
    });
    expect(lookup.ok).toBe(true);
    expect(lookup.content).toBe("a greeting");
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

describe("MDict lookup", () => {
  const importDemo = async () => {
    const storage = await makeTempDir();
    const source = await makeTempDir();
    await writeFile(
      path.join(source, "demo.mdx"),
      buildMdx([
        [
          { key: "run", definition: "run definition" },
          { key: "run-", definition: "run dash definition" },
          { key: "runa", definition: "runa definition" },
        ],
        [
          { key: "zebra", definition: "zebra definition" },
          { key: "zebrafish", definition: "zebrafish definition" },
        ],
      ])
    );
    const result = await importDictionaryBundles(storage, [
      path.join(source, "demo.mdx"),
    ]);
    expect(result.ok).toBe(true);
    expect(result.imported).toHaveLength(1);
    const dict = result.imported[0];
    expect(dict.kind).toBe("mdict");
    const file = path.join(storage, "dict", dict.id, dict.files.mdx);
    const lookup = (word: string) =>
      lookupDictionary({ storagePath: storage, dictId: dict.id, word });
    return { file, lookup };
  };

  it("skips the eager key block parse", async () => {
    const { file } = await importDemo();
    const mdx = new _internal.LazyMdx(file);
    // Large dictionaries take seconds and hundreds of MB to parse eagerly.
    expect(mdx.keywordList).toHaveLength(0);
    expect(mdx.lookup("run").definition).toBe("run definition");
  });

  it("looks up entries across key blocks", async () => {
    const { lookup } = await importDemo();
    expect(await lookup("run")).toMatchObject({ ok: true, content: "run definition" });
    // Keys that normalize to the same block entry must still resolve exactly.
    expect(await lookup("run-")).toMatchObject({
      ok: true,
      content: "run dash definition",
    });
    // Last entry of a block needs the next block's start offset.
    expect(await lookup("runa")).toMatchObject({
      ok: true,
      content: "runa definition",
    });
    expect(await lookup("zebra")).toMatchObject({
      ok: true,
      content: "zebra definition",
    });
    // Last entry of the file ends at the last record block's end offset.
    expect(await lookup("zebrafish")).toMatchObject({
      ok: true,
      content: "zebrafish definition",
    });
    expect(await lookup("runner")).toMatchObject({
      ok: false,
      reason: "not-found",
    });
  });

  it("falls back to eager parsing when block last keys are out of order", async () => {
    const source = await makeTempDir();
    const file = path.join(source, "unordered.mdx");
    await writeFile(
      file,
      buildMdx([
        [{ key: "Z", definition: "Z definition" }],
        [{ key: "a", definition: "a definition" }],
        [{ key: "b", definition: "b definition" }],
        [{ key: "c", definition: "c definition" }],
        [{ key: "d", definition: "d definition" }],
      ])
    );

    const mdx = new _internal.LazyMdx(file);
    // The block index cannot find Z in this file order, so keys are parsed eagerly.
    expect(mdx.keywordList.length).toBeGreaterThan(0);
    expect(mdx.lookup("Z").definition).toBe("Z definition");
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
