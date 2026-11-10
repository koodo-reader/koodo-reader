/**
 * Local dictionary reader: MDict / StarDict / DICT / Slob / BGL.
 *
 * Adapted from:
 * - readest/apps/readest-app/src/services/dictionaries (AGPL-3.0)
 * - ssnangua/ColorTxt/src/main/dictionary (MPL-2.0)
 *
 * readest is licensed under AGPL-3.0; ColorTxt is licensed under MPL-2.0.
 * This file is part of Koodo Reader, which is distributed under AGPL-3.0.
 *
 * All local dictionary parsing lives in this file so the Electron main
 * process only needs one require.  Renderer-side metadata stays in
 * ConfigService and stores relative file names only.
 */

"use strict";

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { Inflate, gunzipSync, inflateSync, unzlibSync } = require("fflate");
const { MDX, MDD } = require("js-mdict");

const DICT_FOLDER = "dict";
const MAX_WORD_LENGTH = 256;
const MAX_READER_CACHE = 5;
const MAX_CHUNK_CACHE = 16;
const TEXT_DECODER = new TextDecoder("utf-8");

/* -------------------------------------------------------------------------- */
/* Generic helpers                                                             */
/* -------------------------------------------------------------------------- */

class LRU {
  constructor(max) {
    this.max = max;
    this.map = new Map();
  }
  get(key) {
    const value = this.map.get(key);
    if (value !== undefined) {
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }
  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.max) {
      const first = this.map.keys().next().value;
      if (first !== undefined) this.map.delete(first);
    }
  }
  clear() {
    this.map.clear();
  }
}

const cmpAscii = (a, b) => {
  const x = String(a).toLowerCase();
  const y = String(b).toLowerCase();
  return x < y ? -1 : x > y ? 1 : 0;
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const textToHtml = (value) =>
  escapeHtml(value)
    .replace(/\r\n?/g, "\n")
    .replace(/\n/g, "<br>");

const stripUnsafeHtml = (value) =>
  String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<link\b[^>]*rel=["']?stylesheet[^>]*>/gi, "")
    .replace(/\u0000+/g, "");

const TRAILING_PUNCT_RE = /[\s\p{P}\p{S}]+$/u;

function stripTrailingPunctuation(value) {
  let out = String(value || "");
  for (let i = 0; i < 8; i++) {
    const next = out.replace(TRAILING_PUNCT_RE, "");
    if (next === out) break;
    out = next;
  }
  return out.trim();
}

function buildLookupCandidates(word) {
  const trimmed = String(word || "").trim();
  if (!trimmed) return [];

  const lower = trimmed.toLowerCase();
  const title = trimmed.charAt(0).toUpperCase() + lower.slice(1);
  const stripped = stripTrailingPunctuation(trimmed);
  const strippedLower = stripped.toLowerCase();
  const strippedTitle =
    stripped.charAt(0).toUpperCase() + strippedLower.slice(1);

  const out = [];
  const seen = new Set();
  for (const candidate of [
    trimmed,
    lower,
    title,
    stripped,
    strippedLower,
    strippedTitle,
  ]) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    out.push(candidate);
  }
  return out;
}

async function readAt(fh, start, size) {
  if (size <= 0) return Buffer.alloc(0);
  const buffer = Buffer.alloc(size);
  const { bytesRead } = await fh.read(buffer, 0, size, start);
  return buffer.subarray(0, bytesRead);
}

function isSafeId(id) {
  if (typeof id !== "string" || !id) return false;
  if (id === "." || id === "..") return false;
  if (id.includes("/") || id.includes("\\")) return false;
  if (path.basename(id) !== id) return false;
  return true;
}

function isSafeFileName(name) {
  if (typeof name !== "string" || !name) return false;
  if (name === "." || name === "..") return false;
  if (name.includes("/") || name.includes("\\")) return false;
  return path.basename(name) === name;
}

function safeJoin(dir, name) {
  if (!isSafeFileName(name)) return null;
  const resolved = path.resolve(dir, name);
  if (path.dirname(resolved) !== path.resolve(dir)) return null;
  return resolved;
}

function normalizeStoragePath(storagePath) {
  if (typeof storagePath !== "string" || !storagePath.trim()) {
    throw new Error("Invalid storage path");
  }
  return path.resolve(storagePath);
}

function dictRoot(storagePath) {
  return path.join(normalizeStoragePath(storagePath), DICT_FOLDER);
}

function dictDir(storagePath, dictId) {
  if (!isSafeId(dictId)) throw new Error("Invalid dictionary id");
  return path.join(dictRoot(storagePath), dictId);
}

function sniffImageMime(bytes) {
  if (!bytes || bytes.length < 4) return "image/png";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    return "image/webp";
  }
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return "image/bmp";
  const head = bytes.subarray(0, 256).toString("utf8").trim().toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) {
    return "image/svg+xml";
  }
  return "image/png";
}

/* -------------------------------------------------------------------------- */
/* Gzip / DictZip                                                              */
/* -------------------------------------------------------------------------- */

const isGzip = (bytes) =>
  bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;

function gzipDataOffset(bytes) {
  if (bytes.length < 10 || !isGzip(bytes) || bytes[2] !== 0x08) return -1;
  const flags = bytes[3];
  let offset = 10;
  if (flags & 0x04) {
    if (offset + 2 > bytes.length) return -1;
    offset = 12 + ((bytes[10] << 8) | bytes[11]);
  }
  if (flags & 0x08) {
    while (offset < bytes.length && bytes[offset] !== 0) offset++;
    offset++;
  }
  if (flags & 0x10) {
    while (offset < bytes.length && bytes[offset] !== 0) offset++;
    offset++;
  }
  if (flags & 0x02) offset += 2;
  return offset;
}

function gunzipTolerant(bytes) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  try {
    return Buffer.from(gunzipSync(buffer));
  } catch (error) {
    const start = gzipDataOffset(buffer);
    if (start < 0) throw error;
    const end = buffer.length >= 8 ? buffer.length - 8 : buffer.length;
    return Buffer.from(inflateSync(buffer.subarray(start, end)));
  }
}

function parseDictZipHeader(bytes) {
  if (
    bytes.length < 12 ||
    bytes[0] !== 0x1f ||
    bytes[1] !== 0x8b ||
    bytes[2] !== 0x08
  ) {
    return null;
  }
  const flags = bytes[3];
  if ((flags & 0x04) === 0) return null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const xlen = view.getUint16(10, true);
  let chlen = 0;
  let chcnt = 0;
  const chunkSizes = [];

  let pos = 12;
  while (pos + 4 <= 12 + xlen) {
    const si1 = bytes[pos];
    const si2 = bytes[pos + 1];
    const slen = view.getUint16(pos + 2, true);
    if (si1 === 0x52 && si2 === 0x41) {
      const version = view.getUint16(pos + 4, true);
      if (version !== 1) return null;
      chlen = view.getUint16(pos + 6, true);
      chcnt = view.getUint16(pos + 8, true);
      for (let i = 0; i < chcnt; i++) {
        chunkSizes.push(view.getUint16(pos + 10 + 2 * i, true));
      }
    }
    pos += 4 + slen;
  }
  if (chcnt === 0 || chunkSizes.length !== chcnt) return null;

  let offset = 12 + xlen;
  if (flags & 0x08) {
    while (offset < bytes.length && bytes[offset] !== 0) offset++;
    offset++;
  }
  if (flags & 0x10) {
    while (offset < bytes.length && bytes[offset] !== 0) offset++;
    offset++;
  }
  if (flags & 0x02) offset += 2;

  return { chlen, chunkSizes, compressedDataOffset: offset };
}

function inflateChunkStreaming(chunkBytes) {
  const parts = [];
  let total = 0;
  try {
    const inflater = new Inflate();
    inflater.ondata = (data) => {
      if (data && data.length) {
        parts.push(data);
        total += data.length;
      }
    };
    inflater.push(chunkBytes, false);
  } catch {
    return null;
  }
  if (total === 0) return null;
  if (parts.length === 1) return parts[0];
  const out = new Uint8Array(total);
  let pos = 0;
  for (const part of parts) {
    out.set(part, pos);
    pos += part.length;
  }
  return out;
}

class BufferedDictBody {
  constructor(buffer) {
    this.buffer = buffer;
  }
  async read(offset, size) {
    return this.buffer.subarray(offset, offset + size);
  }
  async close() {}
}

class DictZipChunkedBody {
  constructor(fh, meta, cacheSize) {
    this.fh = fh;
    this.meta = meta;
    this.cache = new LRU(cacheSize);
    this.chunkOffsets = [];
    let offset = meta.compressedDataOffset;
    for (const size of meta.chunkSizes) {
      this.chunkOffsets.push(offset);
      offset += size;
    }
  }

  async read(offset, size) {
    if (size <= 0) return Buffer.alloc(0);
    const chlen = this.meta.chlen;
    const startChunk = Math.floor(offset / chlen);
    const endChunk = Math.floor((offset + size - 1) / chlen);

    if (startChunk === endChunk) {
      const chunk = await this.getChunk(startChunk);
      const local = offset - startChunk * chlen;
      return chunk.subarray(local, local + size);
    }

    const parts = [];
    let total = 0;
    for (let i = startChunk; i <= endChunk; i++) {
      const chunk = await this.getChunk(i);
      parts.push(chunk);
      total += chunk.length;
    }
    const combined = Buffer.alloc(total);
    let pos = 0;
    for (const part of parts) {
      combined.set(part, pos);
      pos += part.length;
    }
    const local = offset - startChunk * chlen;
    return combined.subarray(local, local + size);
  }

  async getChunk(index) {
    const cached = this.cache.get(index);
    if (cached) return cached;

    const start = this.chunkOffsets[index];
    const compressedSize = this.meta.chunkSizes[index];
    const compressed = await readAt(this.fh, start, compressedSize);
    const inflated = inflateChunkStreaming(compressed);
    if (!inflated) {
      throw new Error(`Failed to inflate DictZip chunk ${index}`);
    }
    const buffer = Buffer.from(inflated);
    this.cache.set(index, buffer);
    return buffer;
  }

  async close() {
    try {
      await this.fh.close();
    } catch {
      // ignore
    }
  }
}

async function probeDictZipChunk(fh, meta) {
  if (!meta.chunkSizes.length) return false;
  const compressed = await readAt(
    fh,
    meta.compressedDataOffset,
    meta.chunkSizes[0]
  );
  const inflated = inflateChunkStreaming(compressed);
  return !!inflated && inflated.length > 0 && inflated.length <= meta.chlen;
}

async function loadDictBody(filePath, options = {}) {
  const cacheSize = options.chunkCacheSize || MAX_CHUNK_CACHE;
  const fh = await fsp.open(filePath, "r");
  try {
    const stat = await fh.stat();
    const head = await readAt(fh, 0, Math.min(stat.size, 64 * 1024));
    if (isGzip(head)) {
      const meta = parseDictZipHeader(head);
      if (meta && (await probeDictZipChunk(fh, meta))) {
        return new DictZipChunkedBody(fh, meta, cacheSize);
      }
      const all = await fsp.readFile(filePath);
      await fh.close();
      return new BufferedDictBody(gunzipTolerant(all));
    }
    const all = await fsp.readFile(filePath);
    await fh.close();
    return new BufferedDictBody(all);
  } catch (error) {
    try {
      await fh.close();
    } catch {
      // ignore
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* StarDict                                                                    */
/* -------------------------------------------------------------------------- */

function parseIfo(text) {
  const out = {};
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || !line.includes("=")) continue;
    const index = line.indexOf("=");
    out[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return out;
}

function scanEntryOffsets(bytes, payloadBytes) {
  const offsets = [];
  let index = 0;
  while (index < bytes.length) {
    offsets.push(index);
    while (index < bytes.length && bytes[index] !== 0) index++;
    if (index >= bytes.length) break;
    index += 1 + payloadBytes;
  }
  return new Int32Array(offsets);
}

function parseStarDictFields(bytes, sametypesequence) {
  const out = [];
  if (sametypesequence) {
    const types = String(sametypesequence).split("");
    if (types.length === 1) {
      out.push({ type: types[0], data: bytes });
      return out;
    }
    let pos = 0;
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      if (i === types.length - 1) {
        out.push({ type, data: bytes.subarray(pos) });
        break;
      }
      if (type >= "A" && type <= "Z") {
        if (pos + 4 > bytes.length) break;
        const length = bytes.readUInt32BE(pos);
        pos += 4;
        out.push({ type, data: bytes.subarray(pos, pos + length) });
        pos += length;
      } else {
        let end = bytes.indexOf(0, pos);
        if (end < 0) end = bytes.length;
        out.push({ type, data: bytes.subarray(pos, end) });
        pos = end + 1;
      }
    }
    return out;
  }

  let pos = 0;
  while (pos < bytes.length) {
    const type = String.fromCharCode(bytes[pos++]);
    let data;
    if (type >= "A" && type <= "Z") {
      if (pos + 4 > bytes.length) break;
      const length = bytes.readUInt32BE(pos);
      pos += 4;
      data = bytes.subarray(pos, pos + length);
      pos += length;
    } else {
      let end = bytes.indexOf(0, pos);
      if (end < 0) end = bytes.length;
      data = bytes.subarray(pos, end);
      pos = end + 1;
    }
    out.push({ type, data });
  }
  return out;
}

function renderStarDictFields(fields) {
  const chunks = [];
  for (const field of fields) {
    const text = TEXT_DECODER.decode(field.data);
    switch (field.type) {
      case "h":
      case "x":
        chunks.push(stripUnsafeHtml(text));
        break;
      case "t":
      case "y":
        chunks.push(`<i>${textToHtml(text)}</i>`);
        break;
      case "P": {
        const mime = sniffImageMime(field.data);
        chunks.push(
          `<img src="data:${mime};base64,${Buffer.from(
            field.data
          ).toString("base64")}" alt="">`
        );
        break;
      }
      case "W":
        chunks.push(
          `<audio controls src="data:audio/wav;base64,${Buffer.from(
            field.data
          ).toString("base64")}"></audio>`
        );
        break;
      case "m":
      case "l":
      case "g":
      case "k":
      case "w":
      case "r":
      default:
        chunks.push(textToHtml(text));
        break;
    }
  }
  return chunks.filter(Boolean).join("<br>");
}

class StarDictReader {
  constructor() {
    this.ifo = {};
    this.body = null;
    this.idxBuffer = null;
    this.idxOffsets = new Int32Array(0);
    this.idxCache = new LRU(256);
    this.synBuffer = null;
    this.synOffsets = null;
    this.synCache = new LRU(256);
  }

  async load(paths) {
    this.ifo = parseIfo(await fsp.readFile(paths.ifo, "utf8"));
    const offsetBits = this.ifo.idxoffsetbits
      ? parseInt(this.ifo.idxoffsetbits, 10)
      : 32;
    if (offsetBits !== 32) {
      throw new Error(`StarDict idxoffsetbits=${offsetBits} is not supported`);
    }

    this.idxBuffer = await fsp.readFile(paths.idx);
    this.idxOffsets = scanEntryOffsets(this.idxBuffer, 8);
    this.body = await loadDictBody(paths.dict);
    if (paths.syn) {
      this.synBuffer = await fsp.readFile(paths.syn);
    }
  }

  get entryCount() {
    return this.idxOffsets.length;
  }

  decodeIdxEntry(index) {
    const cached = this.idxCache.get(index);
    if (cached) return cached;

    const start = this.idxOffsets[index];
    const end =
      index + 1 < this.idxOffsets.length
        ? this.idxOffsets[index + 1]
        : this.idxBuffer.length;
    const buffer = this.idxBuffer.subarray(start, end);
    let nullPos = 0;
    while (nullPos < buffer.length && buffer[nullPos] !== 0) nullPos++;
    const word = TEXT_DECODER.decode(buffer.subarray(0, nullPos));
    const offset = buffer.readUInt32BE(nullPos + 1);
    const size = buffer.readUInt32BE(nullPos + 5);
    const entry = { word, offset, size };
    this.idxCache.set(index, entry);
    return entry;
  }

  lookup(word) {
    let lo = 0;
    let hi = this.idxOffsets.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const entry = this.decodeIdxEntry(mid);
      const compared = cmpAscii(word, entry.word);
      if (compared === 0) return entry;
      if (compared > 0) lo = mid + 1;
      else hi = mid - 1;
    }
    return undefined;
  }

  ensureSynOffsets() {
    if (this.synOffsets) return;
    if (!this.synBuffer) {
      this.synOffsets = new Int32Array(0);
      return;
    }
    this.synOffsets = scanEntryOffsets(this.synBuffer, 4);
  }

  decodeSynEntry(index) {
    const cached = this.synCache.get(index);
    if (cached) return cached;
    if (!this.synBuffer || !this.synOffsets) return undefined;

    const start = this.synOffsets[index];
    const end =
      index + 1 < this.synOffsets.length
        ? this.synOffsets[index + 1]
        : this.synBuffer.length;
    const buffer = this.synBuffer.subarray(start, end);
    let nullPos = 0;
    while (nullPos < buffer.length && buffer[nullPos] !== 0) nullPos++;
    const synonym = TEXT_DECODER.decode(buffer.subarray(0, nullPos));
    const idxIndex = buffer.readUInt32BE(nullPos + 1);
    const entry = { synonym, idxIndex };
    this.synCache.set(index, entry);
    return entry;
  }

  resolveSynonym(word) {
    this.ensureSynOffsets();
    if (!this.synOffsets || !this.synOffsets.length) return undefined;

    let lo = 0;
    let hi = this.synOffsets.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const entry = this.decodeSynEntry(mid);
      if (!entry) return undefined;
      const compared = cmpAscii(word, entry.synonym);
      if (compared === 0) return this.decodeIdxEntry(entry.idxIndex);
      if (compared > 0) lo = mid + 1;
      else hi = mid - 1;
    }
    return undefined;
  }

  lookupWithSynonym(word) {
    return this.lookup(word) || this.resolveSynonym(word);
  }

  async read(entry) {
    if (!this.body) throw new Error("StarDict body not loaded");
    return this.body.read(entry.offset, entry.size);
  }

  async close() {
    if (this.body) await this.body.close();
    this.body = null;
  }
}

/* -------------------------------------------------------------------------- */
/* DICT / dictd                                                                */
/* -------------------------------------------------------------------------- */

const DICT_B64 = (() => {
  const table = new Int8Array(256).fill(-1);
  const set = (chars, base) => {
    for (let i = 0; i < chars.length; i++) {
      table[chars.charCodeAt(i)] = base + i;
    }
  };
  set("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 0);
  set("abcdefghijklmnopqrstuvwxyz", 26);
  set("0123456789", 52);
  table["+".charCodeAt(0)] = 62;
  table["/".charCodeAt(0)] = 63;
  return table;
})();

function decodeDictBase64(value) {
  let result = 0;
  for (let i = 0; i < value.length; i++) {
    const digit = DICT_B64[value.charCodeAt(i)];
    if (digit < 0) throw new Error(`Invalid DICT base64 character: ${value[i]}`);
    result = result * 64 + digit;
  }
  return result;
}

function parseDictIndex(text) {
  const words = [];
  const offsets = [];
  const sizes = [];
  const meta = {};
  let pos = 0;

  while (pos < text.length) {
    let newline = text.indexOf("\n", pos);
    if (newline < 0) newline = text.length;
    const line =
      text.charCodeAt(newline - 1) === 13
        ? text.slice(pos, newline - 1)
        : text.slice(pos, newline);
    pos = newline + 1;
    if (!line) continue;

    const firstTab = line.indexOf("\t");
    if (firstTab < 0) continue;
    const secondTab = line.indexOf("\t", firstTab + 1);
    if (secondTab < 0) continue;

    const word = line.slice(0, firstTab);
    let offset;
    let size;
    try {
      offset = decodeDictBase64(line.slice(firstTab + 1, secondTab));
      size = decodeDictBase64(line.slice(secondTab + 1).trim());
    } catch {
      continue;
    }

    if (word.startsWith("00database")) {
      meta[word] = { offset, size };
      continue;
    }
    words.push(word);
    offsets.push(offset);
    sizes.push(size);
  }

  const order = words
    .map((_, index) => index)
    .sort((a, b) => cmpAscii(words[a], words[b]));

  const sortedWords = new Array(words.length);
  const sortedEntries = new Int32Array(words.length * 2);
  for (let i = 0; i < order.length; i++) {
    const source = order[i];
    sortedWords[i] = words[source];
    sortedEntries[i * 2] = offsets[source];
    sortedEntries[i * 2 + 1] = sizes[source];
  }

  return { words: sortedWords, entries: sortedEntries, meta };
}

class DictReader {
  constructor() {
    this.words = [];
    this.entries = new Int32Array(0);
    this.body = null;
    this.info = {};
  }

  async load(paths) {
    const parsed = parseDictIndex(await fsp.readFile(paths.index, "utf8"));
    this.words = parsed.words;
    this.entries = parsed.entries;
    this.body = await loadDictBody(paths.dict);

    const readMeta = async (key) => {
      const item = parsed.meta[key];
      if (!item || !this.body) return undefined;
      return TEXT_DECODER.decode(await this.body.read(item.offset, item.size))
        .replace(/\u0000+$/g, "")
        .trim();
    };

    this.info = {
      label: await readMeta("00databaseshort"),
      description: await readMeta("00databaseinfo"),
      url: await readMeta("00databaseurl"),
      alphabet: await readMeta("00databasealphabet"),
    };
  }

  get entryCount() {
    return this.words.length;
  }

  lookup(word) {
    let lo = 0;
    let hi = this.words.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const compared = cmpAscii(word, this.words[mid]);
      if (compared === 0) {
        return {
          word: this.words[mid],
          offset: this.entries[mid * 2],
          size: this.entries[mid * 2 + 1],
        };
      }
      if (compared > 0) lo = mid + 1;
      else hi = mid - 1;
    }
    return undefined;
  }

  async readText(entry) {
    if (!this.body) throw new Error("DICT body not loaded");
    return TEXT_DECODER.decode(await this.body.read(entry.offset, entry.size));
  }

  async close() {
    if (this.body) await this.body.close();
    this.body = null;
  }
}

/* -------------------------------------------------------------------------- */
/* MDict                                                                       */
/* -------------------------------------------------------------------------- */

const mdxCache = new Map();
const mddCache = new Map();
const mddResourceCache = new Map();

const setMddResource = (key, value) => {
  mddResourceCache.set(key, value);
  if (mddResourceCache.size > 128) {
    const first = mddResourceCache.keys().next().value;
    if (first !== undefined) mddResourceCache.delete(first);
  }
};

function getMdx(filePath) {
  let instance = mdxCache.get(filePath);
  if (!instance) {
    instance = new MDX(filePath);
    mdxCache.set(filePath, instance);
  }
  return instance;
}

function getMdd(filePath) {
  let instance = mddCache.get(filePath);
  if (!instance) {
    instance = new MDD(filePath);
    mddCache.set(filePath, instance);
  }
  return instance;
}

function clearMdictCache() {
  mdxCache.clear();
  mddCache.clear();
  mddResourceCache.clear();
}

async function readMdxHeader(filePath) {
  const fh = await fsp.open(filePath, "r");
  try {
    const sizeBuffer = await readAt(fh, 0, 4);
    if (sizeBuffer.length < 4) throw new Error("MDX header is truncated");
    const headerSize = sizeBuffer.readUInt32BE(0);
    if (!headerSize || headerSize > 1024 * 1024) {
      throw new Error(`MDX header size out of range: ${headerSize}`);
    }
    const xmlBuffer = await readAt(fh, 4, headerSize);
    const xml = xmlBuffer.toString("utf16le").replace(/\u0000+$/g, "");
    const attrs = {};
    for (const match of xml.matchAll(/(\w+)="((?:.|\r|\n)*?)"/g)) {
      attrs[match[1]] = match[2];
    }
    let encrypt = 0;
    const encrypted = attrs.Encrypted;
    if (!encrypted || encrypted === "No") encrypt = 0;
    else if (encrypted === "Yes") encrypt = 1;
    else {
      const parsed = parseInt(encrypted, 10);
      encrypt = Number.isFinite(parsed) ? parsed : 0;
    }
    return {
      title: attrs.Title ? attrs.Title.trim() : undefined,
      encrypt,
    };
  } finally {
    await fh.close();
  }
}

function simplifyMdictHtml(html) {
  return stripUnsafeHtml(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/\r\n?/g, "\n")
  ).trim();
}

function extractLinkTarget(definition) {
  const trimmed = String(definition || "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!/^@@@LINK=/i.test(trimmed)) return null;
  return trimmed.replace(/^@@@LINK=/i, "").trim() || null;
}

function mimeFromResourcePath(resourcePath) {
  const extension = path.extname(String(resourcePath || "")).toLowerCase();
  switch (extension) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".bmp":
      return "image/bmp";
    case ".svg":
      return "image/svg+xml";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".spx":
      return "audio/speex";
    case ".aac":
      return "audio/aac";
    case ".m4a":
      return "audio/mp4";
    default:
      return "application/octet-stream";
  }
}

function mddKeyCandidates(raw) {
  let value = String(raw || "").trim();
  if (!value) return [];
  value = value.replace(/^(?:sound|entry|file|res):\/\//i, "");
  value = value.replace(/[\u0000-\u001f\u007f]+/g, "");
  try {
    value = decodeURIComponent(value);
  } catch {
    // keep original
  }
  value = value.replace(/^["']+|["']+$/g, "").trim();
  if (!value || /^https?:\/\//i.test(value) || /^data:/i.test(value)) return [];

  value = value.replace(/\\/g, "/");
  while (value.startsWith("./")) value = value.slice(2);
  while (value.startsWith("/")) value = value.slice(1);

  const forward = value;
  const backward = forward.replace(/\//g, "\\");
  const out = [];
  const push = (key) => {
    if (key && !out.includes(key)) out.push(key);
  };
  push(`\\${backward}`);
  push(backward);
  push(`/${forward}`);
  push(forward);
  push(`\\${backward.toLowerCase()}`);
  push(`\\${backward.toUpperCase()}`);
  return out;
}

async function lookupMddResource(mddPaths, rawPath) {
  const keys = mddKeyCandidates(rawPath);
  if (!keys.length || !mddPaths.length) return null;

  for (const mddPath of mddPaths) {
    for (const key of keys) {
      const cacheKey = `${mddPath}\u0000${key}`;
      if (mddResourceCache.has(cacheKey)) {
        const cached = mddResourceCache.get(cacheKey);
        if (cached) return cached;
        continue;
      }

      let result;
      try {
        const mdd = getMdd(mddPath);
        result = mdd.locate(key);
      } catch {
        setMddResource(cacheKey, null);
        continue;
      }

      const base64 = result && result.definition;
      if (!base64) {
        setMddResource(cacheKey, null);
        continue;
      }

      let mime = mimeFromResourcePath((result && result.keyText) || key);
      let output = base64;
      if (mime === "audio/speex") {
        // Browsers cannot play Speex. Keep the original bytes; the popup will
        // simply fail to play this clip instead of crashing lookup.
        mime = "audio/ogg";
      }
      const dataUrl = `data:${mime};base64,${output}`;
      setMddResource(cacheKey, dataUrl);
      for (const alias of keys) {
        if (alias !== key) {
          setMddResource(`${mddPath}\u0000${alias}`, dataUrl);
        }
      }
      return dataUrl;
    }
  }
  return null;
}

async function replaceAttrUrls(html, attrName, mddPaths, options = {}) {
  const regex = new RegExp(
    `(\\b${attrName}\\s*=\\s*)(["'])([^"']*)\\2`,
    "gi"
  );
  const matches = [...html.matchAll(regex)];
  if (!matches.length) return html;

  let out = "";
  let last = 0;
  for (const match of matches) {
    const index = match.index || 0;
    out += html.slice(last, index);
    const full = match[0];
    const prefix = match[1];
    const quote = match[2];
    const raw = match[3];
    const trimmed = raw.trim();
    let replacement = full;

    if (trimmed && !/^data:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
      const isSound = /^(?:sound|res):\/\//i.test(trimmed);
      if (!options.onlySound || isSound) {
        const dataUrl = await lookupMddResource(mddPaths, trimmed);
        if (dataUrl) {
          replacement = `${prefix}${quote}${dataUrl}${quote}`;
        } else if (isSound) {
          replacement = `${prefix}${quote}#${quote}`;
        }
      }
    }
    out += replacement;
    last = index + full.length;
  }
  out += html.slice(last);
  return out;
}

async function resolveMdictResources(html, options = {}) {
  const mddPaths = (options.mddPaths || []).filter(Boolean);
  let value = html;

  if (mddPaths.length) {
    // Images and other embedded resources.
    value = await replaceAttrUrls(value, "src", mddPaths);
    // sound:// / res:// links.
    value = await replaceAttrUrls(value, "href", mddPaths, {
      onlySound: true,
    });
  }

  // entry:// / bword:// cross references: keep the target for the popup.
  value = value.replace(
    /<a\b([^>]*?)\bhref\s*=\s*(["'])(?:entry|bword):\/\/([^"']*)\2([^>]*)>/gi,
    (_match, before, quote, target, after) => {
      let decoded = target;
      try {
        decoded = decodeURIComponent(target);
      } catch {
        // keep
      }
      decoded = decoded
        .replace(/&amp;/gi, "&")
        .replace(/[\u0000-\u001f\u007f]+/g, "")
        .trim();
      const escaped = escapeHtml(decoded);
      return `<a${before} href="#" data-dict-entry="${escaped}"${after}>`;
    }
  );

  return stripUnsafeHtml(value);
}

async function lookupMdict(mdxPath, word, options = {}) {
  const mdx = getMdx(mdxPath);
  const candidates = buildLookupCandidates(word);
  const mddPaths = options.mddPaths || [];

  for (const candidate of candidates) {
    let current = candidate;
    for (let hop = 0; hop < 6; hop++) {
      let result;
      try {
        result = mdx.lookup(current);
      } catch {
        break;
      }
      if (!result || !result.definition) break;

      const link = extractLinkTarget(result.definition);
      if (link && hop < 5) {
        current = link;
        continue;
      }

      let definition = simplifyMdictHtml(result.definition);
      if (mddPaths.length) {
        definition = await resolveMdictResources(definition, { mddPaths });
      }
      return { keyText: result.keyText || current, definition };
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Slob                                                                        */
/* -------------------------------------------------------------------------- */

const SLOB_MAGIC = Buffer.from([0x21, 0x2d, 0x31, 0x53, 0x4c, 0x4f, 0x42, 0x1f]);

function readU32BE(bytes, offset) {
  return (
    (((bytes[offset] << 24) >>> 0) |
      ((bytes[offset + 1] << 16) >>> 0) |
      ((bytes[offset + 2] << 8) >>> 0) |
      bytes[offset + 3]) >>>
    0
  );
}

function decodePascalText(bytes) {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end--;
  return TEXT_DECODER.decode(bytes.subarray(0, end));
}

class ByteCursor {
  constructor(buffer) {
    this.buffer = buffer;
    this.pos = 0;
  }
  read(length) {
    const out = this.buffer.subarray(this.pos, this.pos + length);
    this.pos += length;
    return out;
  }
  byte() {
    return this.buffer[this.pos++];
  }
  u16() {
    const value = (this.buffer[this.pos] << 8) | this.buffer[this.pos + 1];
    this.pos += 2;
    return value;
  }
  u32() {
    const value = readU32BE(this.buffer, this.pos);
    this.pos += 4;
    return value;
  }
  u64() {
    const high = readU32BE(this.buffer, this.pos);
    const low = readU32BE(this.buffer, this.pos + 4);
    this.pos += 8;
    return high * 0x100000000 + low;
  }
  text(lengthBytes) {
    const length = lengthBytes === 1 ? this.byte() : this.u16();
    return decodePascalText(this.read(length));
  }
}

function unzlibTolerant(bytes) {
  try {
    return Buffer.from(unzlibSync(bytes));
  } catch {
    const zlib = require("zlib");
    return zlib.inflateSync(bytes);
  }
}

const SLOB_SUPPORTED_COMPRESSIONS = new Set(["", "zlib", "lzma2"]);

// Slob 的 lzma2 是无容器的裸流，交给 lzma1 的 LZMA2 解码器处理（纯 JS、零依赖）。
// 按需加载：没有 lzma2 词典的会话不会把它载入内存。
const SLOB_LZMA2_DICT_SIZE = 64 * 1024 * 1024;
let lzma2ModulePromise = null;

function getLzma2Module() {
  if (!lzma2ModulePromise) {
    lzma2ModulePromise = import("lzma1").catch((error) => {
      lzma2ModulePromise = null;
      throw error;
    });
  }
  return lzma2ModulePromise;
}

async function unlzma2(bytes) {
  try {
    const { decompressRawLzma2 } = await getLzma2Module();
    // 裸 LZMA2 流不自带字典大小，需要外部指定；
    // maxOutputLength 作为解压炸弹的兜底上限。
    return Buffer.from(
      decompressRawLzma2(bytes, {
        dictSize: SLOB_LZMA2_DICT_SIZE,
        maxOutputLength: SLOB_LZMA2_DICT_SIZE,
      })
    );
  } catch (error) {
    throw new Error(
      `Slob lzma2 decode failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function probeSlob(filePath) {
  const fh = await fsp.open(filePath, "r");
  try {
    const stat = await fh.stat();
    const head = await readAt(fh, 0, Math.min(stat.size, 64 * 1024));
    const cursor = new ByteCursor(head);
    const magic = cursor.read(SLOB_MAGIC.length);
    for (let i = 0; i < SLOB_MAGIC.length; i++) {
      if (magic[i] !== SLOB_MAGIC[i]) throw new Error("Not a Slob file");
    }
    cursor.read(16);
    const encoding = cursor.text(1);
    const compression = cursor.text(1);
    const tagCount = cursor.byte();
    const tags = {};
    for (let i = 0; i < tagCount; i++) {
      tags[cursor.text(1)] = cursor.text(1);
    }
    return {
      encoding,
      compression,
      label: tags.label || tags.title,
    };
  } finally {
    await fh.close();
  }
}

class SlobReader {
  constructor() {
    this.fh = null;
    this.fileSize = 0;
    this.header = {};
    this.refCount = 0;
    this.refsDataOffset = 0;
    this.refPositions = new Float64Array(0);
    this.binCount = 0;
    this.binDataOffset = 0;
    this.binPositions = new Float64Array(0);
    this.refCache = new LRU(1024);
    this.binCache = new LRU(16);
  }

  async load(filePath) {
    this.fh = await fsp.open(filePath, "r");
    this.fileSize = (await this.fh.stat()).size;
    const head = await readAt(this.fh, 0, Math.min(this.fileSize, 64 * 1024));
    const cursor = new ByteCursor(head);
    const magic = cursor.read(SLOB_MAGIC.length);
    for (let i = 0; i < SLOB_MAGIC.length; i++) {
      if (magic[i] !== SLOB_MAGIC[i]) throw new Error("Not a Slob file");
    }
    cursor.read(16);
    const encoding = cursor.text(1);
    if (encoding.toLowerCase() !== "utf-8") {
      throw new Error(`Unsupported Slob encoding: ${encoding}`);
    }
    const compression = cursor.text(1);
    const tagCount = cursor.byte();
    const tags = {};
    for (let i = 0; i < tagCount; i++) {
      tags[cursor.text(1)] = cursor.text(1);
    }
    const contentTypeCount = cursor.byte();
    const contentTypes = [];
    for (let i = 0; i < contentTypeCount; i++) {
      contentTypes.push(cursor.text(2));
    }
    const blobCount = cursor.u32();
    const storeOffset = cursor.u64();
    const fileSize = cursor.u64();
    const refsOffset = cursor.pos;

    if (!SLOB_SUPPORTED_COMPRESSIONS.has(compression)) {
      throw new Error(`Unsupported Slob compression: ${compression}`);
    }
    if (fileSize !== this.fileSize) {
      throw new Error("Slob file size mismatch");
    }

    this.header = {
      encoding,
      compression,
      tags,
      contentTypes,
      blobCount,
      storeOffset,
      fileSize,
      refsOffset,
    };

    const refsHeader = await readAt(this.fh, refsOffset, 4);
    this.refCount = readU32BE(refsHeader, 0);
    const refPosStart = refsOffset + 4;
    const refPosBytes = await readAt(this.fh, refPosStart, this.refCount * 8);
    this.refPositions = new Float64Array(this.refCount);
    for (let i = 0; i < this.refCount; i++) {
      const offset = i * 8;
      const high = readU32BE(refPosBytes, offset);
      const low = readU32BE(refPosBytes, offset + 4);
      this.refPositions[i] = high * 0x100000000 + low;
    }
    this.refsDataOffset = refPosStart + this.refCount * 8;

    const storeHeader = await readAt(this.fh, storeOffset, 4);
    this.binCount = readU32BE(storeHeader, 0);
    const binPosStart = storeOffset + 4;
    const binPosBytes = await readAt(this.fh, binPosStart, this.binCount * 8);
    this.binPositions = new Float64Array(this.binCount);
    for (let i = 0; i < this.binCount; i++) {
      const offset = i * 8;
      const high = readU32BE(binPosBytes, offset);
      const low = readU32BE(binPosBytes, offset + 4);
      this.binPositions[i] = high * 0x100000000 + low;
    }
    this.binDataOffset = binPosStart + this.binCount * 8;
  }

  async decodeRef(index) {
    const cached = this.refCache.get(index);
    if (cached) return cached;
    if (!this.fh) throw new Error("Slob not loaded");

    const start = this.refsDataOffset + this.refPositions[index];
    let slice = await readAt(
      this.fh,
      start,
      Math.min(4 * 1024, this.fileSize - start)
    );
    let pos = 0;
    const keyLength = (slice[pos] << 8) | slice[pos + 1];
    pos += 2;
    if (pos + keyLength + 7 > slice.length) {
      const needed = 2 + keyLength + 4 + 2 + 1 + 255;
      slice = await readAt(
        this.fh,
        start,
        Math.min(needed, this.fileSize - start)
      );
      pos = 2;
    }
    const keyBytes = slice.subarray(pos, pos + keyLength);
    pos += keyLength;
    const binIndex = readU32BE(slice, pos);
    pos += 4;
    const itemIndex = (slice[pos] << 8) | slice[pos + 1];
    pos += 2;
    const fragmentLength = slice[pos];
    pos += 1;
    const fragment = decodePascalText(
      slice.subarray(pos, pos + fragmentLength)
    );
    const ref = {
      key: decodePascalText(keyBytes),
      binIndex,
      itemIndex,
      fragment,
    };
    this.refCache.set(index, ref);
    return ref;
  }

  async findRef(word) {
    if (!this.refCount) return undefined;
    let lo = 0;
    let hi = this.refCount - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const ref = await this.decodeRef(mid);
      const compared = cmpAscii(word, ref.key);
      if (compared === 0) return ref;
      if (compared > 0) lo = mid + 1;
      else hi = mid - 1;
    }
    const near = 8;
    const low = Math.max(0, lo - near);
    const high = Math.min(this.refCount - 1, lo + near);
    for (let i = low; i <= high; i++) {
      const ref = await this.decodeRef(i);
      if (cmpAscii(word, ref.key) === 0) return ref;
    }
    return undefined;
  }

  async getBin(binIndex) {
    const cached = this.binCache.get(binIndex);
    if (cached) return cached;
    if (!this.fh) throw new Error("Slob not loaded");

    const start = this.binDataOffset + this.binPositions[binIndex];
    let headSlice = await readAt(
      this.fh,
      start,
      Math.min(4 * 1024, this.fileSize - start)
    );
    const binItemCount = readU32BE(headSlice, 0);
    if (4 + binItemCount + 4 > headSlice.length) {
      headSlice = await readAt(this.fh, start, 4 + binItemCount + 4);
    }
    const contentTypeIds = Buffer.from(
      headSlice.subarray(4, 4 + binItemCount)
    );
    const compressedLength = readU32BE(headSlice, 4 + binItemCount);
    const compressedStart = start + 4 + binItemCount + 4;
    const compressed = await readAt(this.fh, compressedStart, compressedLength);
    let raw;
    if (this.header.compression === "lzma2") {
      raw = await unlzma2(compressed);
    } else if (this.header.compression === "zlib") {
      raw = unzlibTolerant(compressed);
    } else {
      raw = compressed;
    }
    const result = { contentTypeIds, raw };
    this.binCache.set(binIndex, result);
    return result;
  }

  async readBlob(ref) {
    const bin = await this.getBin(ref.binIndex);
    const itemCount = bin.contentTypeIds.length;
    if (ref.itemIndex >= itemCount) {
      throw new Error("Slob item index out of range");
    }
    const position = readU32BE(bin.raw, ref.itemIndex * 4);
    const dataOffset = itemCount * 4;
    const itemStart = dataOffset + position;
    const itemLength = readU32BE(bin.raw, itemStart);
    const data = bin.raw.subarray(itemStart + 4, itemStart + 4 + itemLength);
    const contentType =
      this.header.contentTypes[bin.contentTypeIds[ref.itemIndex]] || "";
    return { contentType, data: Buffer.from(data) };
  }

  async lookup(word) {
    const ref = await this.findRef(word);
    if (!ref || ref.key.startsWith("~/")) return null;
    const blob = await this.readBlob(ref);
    return { key: ref.key, ...blob };
  }

  async close() {
    if (this.fh) {
      try {
        await this.fh.close();
      } catch {
        // ignore
      }
    }
    this.fh = null;
  }
}

/* -------------------------------------------------------------------------- */
/* BGL                                                                         */
/* -------------------------------------------------------------------------- */

const BGL_MAGIC = [0x12, 0x34, 0x00];

const CHARSET_BY_CODE = new Map([
  [0x41, "windows-1252"],
  [0x42, "windows-1252"],
  [0x43, "windows-1250"],
  [0x44, "windows-1251"],
  [0x45, "shift_jis"],
  [0x46, "big5"],
  [0x47, "gbk"],
  [0x48, "windows-1257"],
  [0x49, "windows-1253"],
  [0x4a, "euc-kr"],
  [0x4b, "windows-1254"],
  [0x4c, "windows-1255"],
  [0x4d, "windows-1256"],
  [0x4e, "windows-874"],
]);

const BGL_LANGUAGES = [
  ["English", "windows-1252"],
  ["French", "windows-1252"],
  ["Italian", "windows-1252"],
  ["Spanish", "windows-1252"],
  ["Dutch", "windows-1252"],
  ["Portuguese", "windows-1252"],
  ["German", "windows-1252"],
  ["Russian", "windows-1251"],
  ["Japanese", "shift_jis"],
  ["Chinese", "big5"],
  ["Chinese", "gbk"],
  ["Greek", "windows-1253"],
  ["Korean", "euc-kr"],
  ["Turkish", "windows-1254"],
  ["Hebrew", "windows-1255"],
  ["Arabic", "windows-1256"],
  ["Thai", "windows-874"],
];

const textDecoders = new Map();

function getTextDecoder(encoding) {
  let decoder = textDecoders.get(encoding);
  if (!decoder) {
    try {
      decoder = new TextDecoder(encoding);
    } catch {
      decoder = new TextDecoder("windows-1252");
    }
    textDecoders.set(encoding, decoder);
  }
  return decoder;
}

function readUInt(bytes, start, end) {
  let value = 0;
  for (let i = start; i < end; i++) value = value * 256 + bytes[i];
  return value;
}

function stripDollarIndexes(bytes) {
  const dollar = bytes.indexOf(0x24);
  if (dollar < 0) return bytes;
  return bytes.subarray(0, dollar);
}

function stripControlAndTags(value) {
  return String(value || "")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function bodyBeforeTrailingFields(bytes) {
  const index = bytes.indexOf(0x14);
  if (index < 0) return bytes;
  return bytes.subarray(0, index);
}

async function probeBgl(filePath) {
  const fh = await fsp.open(filePath, "r");
  try {
    const head = await readAt(fh, 0, 6);
    if (
      head.length < 6 ||
      head[0] !== BGL_MAGIC[0] ||
      head[1] !== BGL_MAGIC[1] ||
      head[2] !== BGL_MAGIC[2] ||
      (head[3] !== 0x01 && head[3] !== 0x02)
    ) {
      throw new Error("Not a Babylon glossary");
    }
    const gzipOffset = (head[4] << 8) | head[5];
    if (gzipOffset < 6) throw new Error("Invalid BGL gzip offset");
    return { gzipOffset };
  } finally {
    await fh.close();
  }
}

class BglReader {
  constructor() {
    this.metadata = {
      sourceEncoding: "windows-1252",
      targetEncoding: "windows-1252",
    };
    this.data = Buffer.alloc(0);
    this.entries = [];
    this.index = new Map();
  }

  async load(filePath) {
    const bytes = await fsp.readFile(filePath);
    if (
      bytes.length < 6 ||
      bytes[0] !== BGL_MAGIC[0] ||
      bytes[1] !== BGL_MAGIC[1] ||
      bytes[2] !== BGL_MAGIC[2] ||
      (bytes[3] !== 0x01 && bytes[3] !== 0x02)
    ) {
      throw new Error("Not a Babylon glossary");
    }
    const gzipOffset = (bytes[4] << 8) | bytes[5];
    this.data = gunzipTolerant(bytes.subarray(gzipOffset));

    const rawInfo = new Map();
    const entryBlocks = [];
    let defaultCharset = "";
    const data = this.data;
    let pos = 0;

    while (pos < data.length) {
      let length = data[pos++];
      const type = length & 0x0f;
      length >>= 4;
      if (length < 4) {
        const byteCount = length + 1;
        if (pos + byteCount > data.length) break;
        length = readUInt(data, pos, pos + byteCount);
        pos += byteCount;
      } else {
        length -= 4;
      }
      if (pos + length > data.length) break;
      if (length > 0) {
        if ([1, 7, 10, 11, 13].includes(type)) {
          entryBlocks.push({ type, start: pos, end: pos + length });
        } else if (type === 3 && length >= 2) {
          rawInfo.set(
            readUInt(data, pos, pos + 2),
            data.subarray(pos + 2, pos + length)
          );
        } else if (type === 0 && data[pos] === 8 && length >= 2) {
          defaultCharset = CHARSET_BY_CODE.get(data[pos + 1]) || "";
        }
      }
      pos += length;
    }

    this.resolveMetadata(rawInfo, defaultCharset);

    for (const block of entryBlocks) {
      const span =
        block.type === 11 ? this.parseEntryWide(block) : this.parseEntry(block);
      if (!span || !span.headword) continue;
      const index = this.entries.length;
      this.entries.push(span);
      for (const key of [span.headword, ...span.alternates]) {
        const normalized = key.toLowerCase();
        const list = this.index.get(normalized);
        if (list) list.push(index);
        else this.index.set(normalized, [index]);
      }
    }
  }

  get entryCount() {
    return this.entries.length;
  }

  findEntries(word) {
    const indices = this.index.get(String(word || "").trim().toLowerCase()) || [];
    return indices.map((index) => {
      const span = this.entries[index];
      return {
        headword: span.headword,
        alternates: span.alternates,
        definition: this.processDefinition(
          this.data.subarray(span.definitionStart, span.definitionEnd)
        ),
      };
    });
  }

  resolveMetadata(rawInfo, defaultCharset) {
    const languageOf = (code) =>
      code === undefined ? undefined : BGL_LANGUAGES[code];
    const charsetOf = (value) =>
      value && value.length > 0 ? CHARSET_BY_CODE.get(value[0]) : undefined;

    const sourceValue = rawInfo.get(0x07);
    const targetValue = rawInfo.get(0x08);
    const sourceLanguage = languageOf(
      sourceValue ? readUInt(sourceValue, 0, sourceValue.length) : undefined
    );
    const targetLanguage = languageOf(
      targetValue ? readUInt(targetValue, 0, targetValue.length) : undefined
    );

    const flagsValue = rawInfo.get(0x11);
    const utf8Everywhere =
      flagsValue !== undefined &&
      (readUInt(flagsValue, 0, flagsValue.length) & 0x8000) !== 0;

    const defaultEncoding = defaultCharset || "windows-1252";
    const sourceEncoding = utf8Everywhere
      ? "utf-8"
      : charsetOf(rawInfo.get(0x1a)) ||
        (sourceLanguage && sourceLanguage[1]) ||
        defaultEncoding;
    const targetEncoding = utf8Everywhere
      ? "utf-8"
      : charsetOf(rawInfo.get(0x1b)) ||
        (targetLanguage && targetLanguage[1]) ||
        defaultEncoding;

    const titleBytes = rawInfo.get(0x01);
    const title = titleBytes
      ? getTextDecoder(targetEncoding)
          .decode(titleBytes)
          .replace(/\u0000+/g, "")
          .trim() || undefined
      : undefined;

    this.metadata = { title, sourceEncoding, targetEncoding };
  }

  processKey(bytes) {
    return stripControlAndTags(
      getTextDecoder(this.metadata.sourceEncoding).decode(
        stripDollarIndexes(bytes)
      )
    );
  }

  parseEntry(block) {
    const data = this.data;
    let pos = block.start;
    if (pos + 1 > block.end) return null;
    const wordLength = data[pos++];
    if (pos + wordLength > block.end) return null;
    const headword = this.processKey(data.subarray(pos, pos + wordLength));
    pos += wordLength;
    if (pos + 2 > block.end) return null;
    const definitionLength = readUInt(data, pos, pos + 2);
    pos += 2;
    if (pos + definitionLength > block.end) return null;
    const definitionStart = pos;
    pos += definitionLength;
    const alternates = new Set();
    while (pos < block.end) {
      const altLength = data[pos++];
      if (pos + altLength > block.end) return null;
      const alternate = this.processKey(data.subarray(pos, pos + altLength));
      if (alternate) alternates.add(alternate);
      pos += altLength;
    }
    alternates.delete(headword);
    return {
      headword,
      alternates: [...alternates],
      definitionStart,
      definitionEnd: definitionStart + definitionLength,
    };
  }

  parseEntryWide(block) {
    const data = this.data;
    let pos = block.start;
    if (pos + 5 > block.end) return null;
    const wordLength = readUInt(data, pos, pos + 5);
    pos += 5;
    if (pos + wordLength > block.end) return null;
    const headword = this.processKey(data.subarray(pos, pos + wordLength));
    pos += wordLength;
    if (pos + 4 > block.end) return null;
    const altCount = readUInt(data, pos, pos + 4);
    pos += 4;
    const alternates = new Set();
    for (let i = 0; i < altCount; i++) {
      if (pos + 4 > block.end) return null;
      const altLength = readUInt(data, pos, pos + 4);
      pos += 4;
      if (altLength === 0) break;
      if (pos + altLength > block.end) return null;
      const alternate = this.processKey(data.subarray(pos, pos + altLength));
      if (alternate) alternates.add(alternate);
      pos += altLength;
    }
    alternates.delete(headword);
    if (pos + 4 > block.end) return null;
    const definitionLength = readUInt(data, pos, pos + 4);
    pos += 4;
    if (pos + definitionLength > block.end) return null;
    return {
      headword,
      alternates: [...alternates],
      definitionStart: pos,
      definitionEnd: pos + definitionLength,
    };
  }

  processDefinition(bytes) {
    const body = bodyBeforeTrailingFields(bytes);
    return stripControlAndTags(
      getTextDecoder(this.metadata.targetEncoding)
        .decode(body)
        .replace(/\r\n?/g, "\n")
    );
  }

  async close() {}
}

/* -------------------------------------------------------------------------- */
/* Import / grouping                                                           */
/* -------------------------------------------------------------------------- */

function classifyFile(filePath) {
  const name = path.basename(filePath);
  const lower = name.toLowerCase();
  const lastDot = lower.lastIndexOf(".");
  const extension = lastDot >= 0 ? lower.slice(lastDot + 1) : "";
  const beforeLast = lastDot >= 0 ? lower.slice(0, lastDot) : lower;
  const isDictZip = extension === "dz" && beforeLast.endsWith(".dict");
  let stem;
  if (isDictZip) {
    stem = beforeLast.slice(0, -".dict".length);
  } else if (lastDot >= 0) {
    stem = beforeLast;
  } else {
    stem = lower;
  }
  return { absPath: filePath, name, stem, extension, isDictZip };
}

function isCompanionMddStem(bundleStem, mddStem) {
  if (mddStem === bundleStem) return false;
  if (!mddStem.startsWith(bundleStem)) return false;
  const boundary = mddStem.charAt(bundleStem.length);
  return boundary !== "" && !/[a-z0-9]/i.test(boundary);
}

function groupBundlesByStem(filePaths) {
  const classified = filePaths.map(classifyFile);
  const cssFiles = classified.filter((file) => file.extension === "css");
  const byStem = new Map();

  for (const file of classified) {
    if (file.extension === "css") continue;
    if (!byStem.has(file.stem)) byStem.set(file.stem, []);
    byStem.get(file.stem).push(file);
  }

  const bundles = [];
  const orphans = [];

  for (const [stem, group] of byStem) {
    const ifo = group.find((file) => file.extension === "ifo");
    const idx = group.find((file) => file.extension === "idx");
    const indexFile = group.find((file) => file.extension === "index");
    const dict = group.find(
      (file) => file.extension === "dict" || file.isDictZip
    );
    const syn = group.find((file) => file.extension === "syn");
    const mdx = group.find((file) => file.extension === "mdx");
    const mdd = group.filter((file) => file.extension === "mdd");
    const slob = group.find((file) => file.extension === "slob");
    const bgl = group.find((file) => file.extension === "bgl");

    if (ifo && idx && dict) {
      bundles.push({ kind: "stardict", stem, ifo, idx, dict, syn });
    } else if (indexFile && dict) {
      bundles.push({ kind: "dict", stem, index: indexFile, dict });
    } else if (mdx) {
      bundles.push({ kind: "mdict", stem, mdx, mdd, css: [] });
    } else if (slob) {
      bundles.push({ kind: "slob", stem, slob });
    } else if (bgl) {
      bundles.push({ kind: "bgl", stem, bgl });
    } else {
      orphans.push(...group);
    }
  }

  const mdictBundles = bundles
    .filter((bundle) => bundle.kind === "mdict")
    .sort((a, b) => b.stem.length - a.stem.length);

  if (mdictBundles.length > 0) {
    const remaining = [];
    for (const file of orphans) {
      const target =
        file.extension === "mdd"
          ? mdictBundles.find((bundle) =>
              isCompanionMddStem(bundle.stem, file.stem)
            )
          : undefined;
      if (target) target.mdd.push(file);
      else remaining.push(file);
    }
    orphans.length = 0;
    orphans.push(...remaining);

    for (const bundle of mdictBundles) {
      const sameStem = cssFiles.filter((file) => file.stem === bundle.stem);
      bundle.css =
        mdictBundles.length === 1 ? [...cssFiles] : sameStem;
    }
  } else {
    orphans.push(...cssFiles);
  }

  return { bundles, orphans };
}

async function describeBundle(bundle, dir, nameOverride) {
  const meta = {
    kind: bundle.kind,
    files: {},
    addedAt: Date.now(),
  };

  if (bundle.kind === "stardict") {
    meta.files = {
      ifo: bundle.ifo.name,
      idx: bundle.idx.name,
      dict: bundle.dict.name,
    };
    if (bundle.syn) meta.files.syn = bundle.syn.name;

    const ifo = parseIfo(
      await fsp.readFile(path.join(dir, bundle.ifo.name), "utf8")
    );
    meta.name = nameOverride || ifo.bookname || bundle.stem;
    const offsetBits = ifo.idxoffsetbits
      ? parseInt(ifo.idxoffsetbits, 10)
      : 32;
    if (offsetBits !== 32) {
      meta.unsupported = true;
      meta.unsupportedReason = "stardict-64bit-offset";
    }
    return meta;
  }

  if (bundle.kind === "dict") {
    meta.files = { index: bundle.index.name, dict: bundle.dict.name };
    meta.name = nameOverride || bundle.stem;
    return meta;
  }

  if (bundle.kind === "mdict") {
    meta.files = {
      mdx: bundle.mdx.name,
      mdd: bundle.mdd.map((file) => file.name),
      css: bundle.css.map((file) => file.name),
    };
    meta.name = nameOverride || bundle.stem;
    try {
      const header = await readMdxHeader(path.join(dir, bundle.mdx.name));
      if (header.title) meta.name = nameOverride || header.title;
      // Encrypted="2" only encrypts the key info block, which js-mdict
      // handles transparently. Only bit 0 marks record encryption.
      if (header.encrypt & 1) {
        meta.unsupported = true;
        meta.unsupportedReason = "mdict-encrypted";
      }
    } catch {
      meta.unsupported = true;
      meta.unsupportedReason = "mdict-header";
    }
    return meta;
  }

  if (bundle.kind === "slob") {
    meta.files = { slob: bundle.slob.name };
    meta.name = nameOverride || bundle.stem;
    try {
      const probe = await probeSlob(path.join(dir, bundle.slob.name));
      if (probe.label) meta.name = nameOverride || probe.label;
      if (!SLOB_SUPPORTED_COMPRESSIONS.has(probe.compression)) {
        meta.unsupported = true;
        meta.unsupportedReason = "slob-compression";
      }
      if (probe.encoding && probe.encoding.toLowerCase() !== "utf-8") {
        meta.unsupported = true;
        meta.unsupportedReason = "slob-encoding";
      }
    } catch {
      meta.unsupported = true;
      meta.unsupportedReason = "slob-invalid";
    }
    return meta;
  }

  meta.files = { bgl: bundle.bgl.name };
  meta.name = nameOverride || bundle.stem;
  try {
    await probeBgl(path.join(dir, bundle.bgl.name));
  } catch {
    meta.unsupported = true;
    meta.unsupportedReason = "bgl-invalid";
  }
  return meta;
}

async function copyFileInto(dir, file) {
  const target = path.join(dir, file.name);
  await fsp.copyFile(file.absPath, target);
  return file.name;
}

async function importOneBundle(root, bundle) {
  const id = bundle.id;
  const dir = path.join(root, id);
  await fsp.mkdir(dir, { recursive: true });

  try {
    if (bundle.kind === "stardict") {
      bundle.ifo.name = await copyFileInto(dir, bundle.ifo);
      bundle.idx.name = await copyFileInto(dir, bundle.idx);
      bundle.dict.name = await copyFileInto(dir, bundle.dict);
      if (bundle.syn) bundle.syn.name = await copyFileInto(dir, bundle.syn);
    } else if (bundle.kind === "dict") {
      bundle.index.name = await copyFileInto(dir, bundle.index);
      bundle.dict.name = await copyFileInto(dir, bundle.dict);
    } else if (bundle.kind === "mdict") {
      bundle.mdx.name = await copyFileInto(dir, bundle.mdx);
      for (const file of bundle.mdd) {
        file.name = await copyFileInto(dir, file);
      }
      for (const file of bundle.css) {
        file.name = await copyFileInto(dir, file);
      }
    } else if (bundle.kind === "slob") {
      bundle.slob.name = await copyFileInto(dir, bundle.slob);
    } else if (bundle.kind === "bgl") {
      bundle.bgl.name = await copyFileInto(dir, bundle.bgl);
    }

    const meta = await describeBundle(bundle, dir);
    return { id, ...meta };
  } catch (error) {
    await fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

async function importDictionaryBundles(storagePath, filePaths) {
  const root = dictRoot(storagePath);
  await fsp.mkdir(root, { recursive: true });

  const paths = Array.isArray(filePaths)
    ? filePaths.filter(
        (filePath) => typeof filePath === "string" && filePath.trim()
      )
    : [];
  if (!paths.length) {
    return { ok: false, message: "No files selected" };
  }

  const { bundles, orphans } = groupBundlesByStem(paths);
  if (!bundles.length) {
    return {
      ok: false,
      message: "No dictionary bundle recognized",
      orphans: orphans.map((file) => file.name),
    };
  }

  let timestamp = Date.now();
  const imported = [];
  const errors = [];

  for (const bundle of bundles) {
    let id = String(timestamp++);
    while (fs.existsSync(path.join(root, id))) {
      id = String(timestamp++);
    }
    bundle.id = id;
    try {
      imported.push(await importOneBundle(root, bundle));
    } catch (error) {
      errors.push({
        name: bundle.stem,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    ok: imported.length > 0,
    imported,
    orphans: orphans.map((file) => file.name),
    errors,
  };
}

async function importDictionaryBuffer(storagePath, payload) {
  const root = dictRoot(storagePath);
  const id =
    payload && typeof payload.id === "string" && isSafeId(payload.id)
      ? payload.id
      : String(Date.now());
  const extension =
    payload && typeof payload.extension === "string"
      ? payload.extension.replace(/^\./, "").toLowerCase()
      : "mdx";
  if (extension !== "mdx") {
    return { ok: false, message: "Unsupported buffer format" };
  }

  const dir = path.join(root, id);
  await fsp.mkdir(dir, { recursive: true });
  const name =
    payload && typeof payload.name === "string" && payload.name.trim()
      ? payload.name.trim()
      : id;
  const fileName = `${id}.${extension}`;
  if (!payload || !payload.buffer) {
    return { ok: false, message: "Missing dictionary buffer" };
  }
  const buffer = Buffer.isBuffer(payload.buffer)
    ? payload.buffer
    : Buffer.from(payload.buffer);
  await fsp.writeFile(path.join(dir, fileName), buffer);

  try {
    const meta = await describeDirectory(dir, name);
    return { ok: true, dict: { id, ...meta, name } };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Migration                                                                   */
/* -------------------------------------------------------------------------- */

async function listFiles(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(dir, entry.name));
}

async function describeDirectory(dir, nameOverride) {
  const files = await listFiles(dir);
  if (!files.length) {
    return {
      kind: "unknown",
      files: {},
      name: nameOverride || path.basename(dir),
      addedAt: Date.now(),
      unsupported: true,
      unsupportedReason: "missing-files",
    };
  }
  const { bundles } = groupBundlesByStem(files);
  if (!bundles.length) {
    return {
      kind: "unknown",
      files: {},
      name: nameOverride || path.basename(dir),
      addedAt: Date.now(),
      unsupported: true,
      unsupportedReason: "unknown",
    };
  }
  return describeBundle(bundles[0], dir, nameOverride);
}

async function migrateDictionaries(storagePath, dicts) {
  const root = dictRoot(storagePath);
  await fsp.mkdir(root, { recursive: true });

  const migrated = [];
  const removedIds = [];
  const list = Array.isArray(dicts) ? dicts : [];

  for (const item of list) {
    const id = item && item.id;
    if (!isSafeId(id)) {
      removedIds.push(String(id || ""));
      continue;
    }
    const name = typeof item.name === "string" ? item.name : id;
    const dir = path.join(root, id);

    try {
      const exists = await fsp
        .stat(dir)
        .then((stat) => stat.isDirectory())
        .catch(() => false);

      if (!exists) {
        const files = await fsp.readdir(root, { withFileTypes: true });
        const loose = files
          .filter(
            (entry) =>
              entry.isFile() &&
              (entry.name === id || entry.name.startsWith(`${id}.`))
          )
          .map((entry) => path.join(root, entry.name));

        if (!loose.length) {
          removedIds.push(id);
          continue;
        }

        await fsp.mkdir(dir, { recursive: true });
        for (const source of loose) {
          const target = path.join(dir, path.basename(source));
          try {
            await fsp.rename(source, target);
          } catch {
            await fsp.copyFile(source, target);
            await fsp.unlink(source).catch(() => {});
          }
        }
      }

      const meta = await describeDirectory(dir, name);
      if (meta.unsupported && meta.unsupportedReason === "missing-files") {
        await fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
        removedIds.push(id);
        continue;
      }
      migrated.push({ id, ...meta });
    } catch (error) {
      migrated.push({
        id,
        name,
        kind: "unknown",
        files: {},
        addedAt: Date.now(),
        unsupported: true,
        unsupportedReason: "migrate-failed",
      });
    }
  }

  return { migrated, removedIds };
}

/* -------------------------------------------------------------------------- */
/* Lookup service                                                              */
/* -------------------------------------------------------------------------- */

const bundleMetaCache = new Map();
const readerCache = new Map();

const cacheKey = (storagePath, dictId) =>
  `${path.resolve(storagePath)}\u0000${dictId}`;

function closeReader(reader) {
  if (reader && typeof reader.close === "function") {
    Promise.resolve(reader.close()).catch(() => {});
  }
}

function clearDictCache(storagePath, dictId) {
  if (storagePath && dictId) {
    const key = cacheKey(storagePath, dictId);
    bundleMetaCache.delete(key);
    const entry = readerCache.get(key);
    if (entry) closeReader(entry.reader);
    readerCache.delete(key);
    clearMdictCache();
    return;
  }
  for (const entry of readerCache.values()) {
    closeReader(entry.reader);
  }
  readerCache.clear();
  bundleMetaCache.clear();
  clearMdictCache();
}

async function getBundleMeta(storagePath, dictId) {
  const key = cacheKey(storagePath, dictId);
  const cached = bundleMetaCache.get(key);
  if (cached) return cached;

  const dir = dictDir(storagePath, dictId);
  const files = await listFiles(dir);
  if (!files.length) throw new Error("Dictionary files are missing");
  const { bundles } = groupBundlesByStem(files);
  if (!bundles.length) throw new Error("Dictionary files are not recognized");

  const meta = await describeBundle(bundles[0], dir);
  bundleMetaCache.set(key, meta);
  return meta;
}

async function getLoadedReader(storagePath, dictId, meta) {
  const key = cacheKey(storagePath, dictId);
  const cached = readerCache.get(key);
  if (cached && cached.kind === meta.kind) return cached.reader;

  const dir = dictDir(storagePath, dictId);
  let reader;
  if (meta.kind === "stardict") {
    reader = new StarDictReader();
    await reader.load({
      ifo: safeJoin(dir, meta.files.ifo),
      idx: safeJoin(dir, meta.files.idx),
      dict: safeJoin(dir, meta.files.dict),
      syn: meta.files.syn ? safeJoin(dir, meta.files.syn) : undefined,
    });
  } else if (meta.kind === "dict") {
    reader = new DictReader();
    await reader.load({
      index: safeJoin(dir, meta.files.index),
      dict: safeJoin(dir, meta.files.dict),
    });
  } else if (meta.kind === "slob") {
    reader = new SlobReader();
    await reader.load(safeJoin(dir, meta.files.slob));
  } else if (meta.kind === "bgl") {
    reader = new BglReader();
    await reader.load(safeJoin(dir, meta.files.bgl));
  } else {
    throw new Error(`Unsupported dictionary kind: ${meta.kind}`);
  }

  readerCache.set(key, { kind: meta.kind, reader });
  if (readerCache.size > MAX_READER_CACHE) {
    const firstKey = readerCache.keys().next().value;
    if (firstKey && firstKey !== key) {
      const oldest = readerCache.get(firstKey);
      if (oldest) closeReader(oldest.reader);
      readerCache.delete(firstKey);
    }
  }
  return reader;
}

function renderSlobResult(result) {
  const contentType = String(result.contentType || "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  const text = TEXT_DECODER.decode(result.data);

  if (contentType === "text/html" || contentType === "application/xhtml+xml") {
    return stripUnsafeHtml(
      text.replace(/<link\b[^>]*rel=["']?stylesheet[^>]*>/gi, "")
    );
  }
  if (contentType === "text/plain" || contentType === "") {
    return textToHtml(text);
  }
  return textToHtml(text);
}

async function lookupDictionary(payload) {
  const word = String((payload && payload.word) || "").trim();
  if (!word || word.length > MAX_WORD_LENGTH) {
    return { ok: false, reason: "invalid-word" };
  }

  const storagePath = payload && payload.storagePath;
  const dictId = payload && payload.dictId;
  if (!isSafeId(dictId)) {
    return { ok: false, reason: "invalid-id" };
  }

  try {
    const meta = await getBundleMeta(storagePath, dictId);
    if (meta.unsupported) {
      return {
        ok: false,
        reason: "unsupported",
        message: meta.unsupportedReason || "unknown",
      };
    }

    const candidates = buildLookupCandidates(word);
    const dir = dictDir(storagePath, dictId);

    if (meta.kind === "mdict") {
      const mdxPath = safeJoin(dir, meta.files.mdx);
      const mddPaths = (meta.files.mdd || [])
        .map((file) => safeJoin(dir, file))
        .filter(Boolean);
      const result = await lookupMdict(mdxPath, word, { mddPaths });
      if (!result || !result.definition.trim()) {
        return { ok: false, reason: "not-found" };
      }
      return { ok: true, content: result.definition };
    }

    if (meta.kind === "stardict") {
      const reader = await getLoadedReader(storagePath, dictId, meta);
      let entry;
      for (const candidate of candidates) {
        entry = reader.lookupWithSynonym(candidate);
        if (entry) break;
      }
      if (!entry) return { ok: false, reason: "not-found" };
      const fields = parseStarDictFields(
        await reader.read(entry),
        reader.ifo.sametypesequence
      );
      const content = renderStarDictFields(fields);
      if (!content.trim()) return { ok: false, reason: "not-found" };
      return { ok: true, content };
    }

    if (meta.kind === "dict") {
      const reader = await getLoadedReader(storagePath, dictId, meta);
      let entry;
      for (const candidate of candidates) {
        entry = reader.lookup(candidate);
        if (entry) break;
      }
      if (!entry) return { ok: false, reason: "not-found" };
      const text = await reader.readText(entry);
      if (!text.trim()) return { ok: false, reason: "not-found" };
      return { ok: true, content: textToHtml(text) };
    }

    if (meta.kind === "slob") {
      const reader = await getLoadedReader(storagePath, dictId, meta);
      let result;
      for (const candidate of candidates) {
        result = await reader.lookup(candidate);
        if (result) break;
      }
      if (!result) return { ok: false, reason: "not-found" };
      return { ok: true, content: renderSlobResult(result) };
    }

    if (meta.kind === "bgl") {
      const reader = await getLoadedReader(storagePath, dictId, meta);
      let entries = [];
      for (const candidate of candidates) {
        entries = reader.findEntries(candidate);
        if (entries.length) break;
      }
      const content = entries
        .map((entry) => stripUnsafeHtml(entry.definition))
        .filter(Boolean)
        .join("<br><br>");
      if (!content.trim()) return { ok: false, reason: "not-found" };
      return { ok: true, content };
    }

    return { ok: false, reason: "unsupported" };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function removeDictionary(storagePath, dictId) {
  if (!isSafeId(dictId)) return { ok: false, message: "Invalid dictionary id" };
  const root = dictRoot(storagePath);
  const dir = path.join(root, dictId);
  await fsp.rm(dir, { recursive: true, force: true });

  const entries = await fsp.readdir(root, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (
      entry.isFile() &&
      (entry.name === dictId || entry.name.startsWith(`${dictId}.`))
    ) {
      await fsp.unlink(path.join(root, entry.name)).catch(() => {});
    }
  }

  clearDictCache(storagePath, dictId);
  return { ok: true };
}

module.exports = {
  importDictionaryBundles,
  importDictionaryBuffer,
  migrateDictionaries,
  removeDictionary,
  lookupDictionary,
  clearDictCache,
  DICT_FOLDER,
  _internal: {
    parseIfo,
    scanEntryOffsets,
    parseStarDictFields,
    parseDictIndex,
    decodeDictBase64,
    parseDictZipHeader,
    classifyFile,
    groupBundlesByStem,
    buildLookupCandidates,
    describeBundle,
    unlzma2,
  },
};
