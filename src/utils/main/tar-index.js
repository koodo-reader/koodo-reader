const fs = require("fs");
const path = require("path");

const normalizeArchiveEntryName = (name) =>
  String(name || "")
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "");

const ensureEntryInside = (baseDir, entryName) => {
  const normalized = normalizeArchiveEntryName(entryName);
  if (!normalized) throw new Error("Invalid empty archive entry name");
  const base = path.resolve(baseDir);
  const target = path.resolve(base, normalized);
  const rel = path.relative(base, target);
  if (
    rel.startsWith(".." + path.sep) ||
    path.isAbsolute(rel) ||
    rel.split(path.sep).includes("..")
  ) {
    throw new Error("Archive entry path escapes the extraction directory");
  }
  return target;
};

// ---- Tar 偏移索引：顺序解析 512 字节头并记录每个条目的数据偏移，
// 解压时按偏移 seek 直读，避免每次都从头流式遍历整个 tar 文件 ----
const TAR_BLOCK_SIZE = 512;
const TAR_INDEX_CACHE_MAX = 6;
const tarIndexCache = new Map();
const tarIndexPending = new Map();
const parseTarOctal = (buf, offset, length) => {
  let value = 0;
  let started = false;
  for (let i = 0; i < length; i++) {
    const byte = buf[offset + i];
    if (byte === 0 || byte === 0x20) {
      if (started) break;
      continue;
    }
    if (byte < 0x30 || byte > 0x37) return -1;
    started = true;
    value = value * 8 + (byte - 0x30);
  }
  return started ? value : -1;
};
const parseTarBinary = (buf, offset, length) => {
  let value = buf[offset] & 0x7f;
  for (let i = 1; i < length; i++) value = value * 256 + buf[offset + i];
  return value;
};
const parseTarSize = (buf, offset, length) =>
  buf[offset] & 0x80
    ? parseTarBinary(buf, offset, length)
    : parseTarOctal(buf, offset, length);
const parseTarText = (buf, offset, length) => {
  let end = offset;
  const limit = offset + length;
  while (end < limit && buf[end] !== 0) end++;
  return buf.toString("utf8", offset, end);
};
const verifyTarChecksum = (header) => {
  const stored = parseTarOctal(header, 148, 8);
  if (stored < 0) return false;
  let unsignedSum = 0;
  let signedSum = 0;
  for (let i = 0; i < TAR_BLOCK_SIZE; i++) {
    const byte = i >= 148 && i < 156 ? 0x20 : header[i];
    unsignedSum += byte;
    signedSum += byte >= 128 ? byte - 256 : byte;
  }
  return stored === unsignedSum || stored === signedSum;
};
const parsePaxRecords = (data) => {
  const records = {};
  let pos = 0;
  while (pos < data.length) {
    const spaceIdx = data.indexOf(0x20, pos);
    if (spaceIdx < 0) break;
    let total = 0;
    let valid = true;
    for (let i = pos; i < spaceIdx; i++) {
      const byte = data[i];
      if (byte < 0x30 || byte > 0x39) {
        valid = false;
        break;
      }
      total = total * 10 + (byte - 0x30);
    }
    if (
      !valid ||
      total <= spaceIdx - pos ||
      pos + total > data.length ||
      data[pos + total - 1] !== 0x0a
    ) {
      break;
    }
    const eqIdx = data.indexOf(0x3d, spaceIdx + 1);
    if (eqIdx < 0 || eqIdx >= pos + total - 1) break;
    records[data.toString("utf8", spaceIdx + 1, eqIdx)] = data.toString(
      "utf8",
      eqIdx + 1,
      pos + total - 1
    );
    pos += total;
  }
  return records;
};
const readTarDataBlock = (fd, start, paddedSize, fileSize) => {
  if (start + paddedSize > fileSize || paddedSize > 16 * 1024 * 1024) {
    return null;
  }
  const data = Buffer.alloc(paddedSize);
  let read = 0;
  while (read < paddedSize) {
    const bytes = fs.readSync(fd, data, read, paddedSize - read, start + read);
    if (bytes <= 0) return null;
    read += bytes;
  }
  return data;
};
const scanTarIndex = (filePath, stat) => {
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
  } catch (e) {
    return { ok: false };
  }
  try {
    const entries = [];
    const header = Buffer.alloc(TAR_BLOCK_SIZE);
    let paxName = null;
    let paxSize = null;
    let gnuName = null;
    let pos = 0;
    while (pos + TAR_BLOCK_SIZE <= stat.size) {
      let read = 0;
      while (read < TAR_BLOCK_SIZE) {
        const bytes = fs.readSync(
          fd,
          header,
          read,
          TAR_BLOCK_SIZE - read,
          pos + read
        );
        if (bytes <= 0) return { ok: false };
        read += bytes;
      }
      let allZero = true;
      for (let i = 0; i < TAR_BLOCK_SIZE; i++) {
        if (header[i] !== 0) {
          allZero = false;
          break;
        }
      }
      if (allZero) break;
      if (!verifyTarChecksum(header)) return { ok: false };
      const typeCode = header[156];
      const typeflag = String.fromCharCode(typeCode || 0x30);
      const headerSize = parseTarSize(header, 124, 12);
      if (headerSize < 0) return { ok: false };
      const dataOffset = pos + TAR_BLOCK_SIZE;
      if (
        typeflag === "x" ||
        typeflag === "g" ||
        typeflag === "L" ||
        typeflag === "K"
      ) {
        const paddedSize =
          Math.ceil(headerSize / TAR_BLOCK_SIZE) * TAR_BLOCK_SIZE;
        const data = readTarDataBlock(fd, dataOffset, paddedSize, stat.size);
        if (!data) return { ok: false };
        if (typeflag === "x") {
          const records = parsePaxRecords(data.subarray(0, headerSize));
          if (
            Object.keys(records).some((key) => key.startsWith("GNU.sparse"))
          ) {
            return { ok: false };
          }
          paxName = Object.prototype.hasOwnProperty.call(records, "path")
            ? records.path
            : null;
          paxSize = Object.prototype.hasOwnProperty.call(records, "size")
            ? Number(records.size)
            : null;
          if (paxSize !== null && (!Number.isFinite(paxSize) || paxSize < 0)) {
            paxSize = null;
          }
        } else if (typeflag === "L") {
          gnuName = parseTarText(data, 0, Math.min(headerSize, data.length));
        }
        pos = dataOffset + paddedSize;
        continue;
      }
      if (typeflag === "S" || typeflag === "D" || typeflag === "M") {
        return { ok: false };
      }
      const size = paxSize !== null ? paxSize : headerSize;
      const paddedSize = Math.ceil(size / TAR_BLOCK_SIZE) * TAR_BLOCK_SIZE;
      if (dataOffset + paddedSize > stat.size) return { ok: false };
      const magic = header.toString("utf8", 257, 262);
      const version = header.toString("utf8", 263, 265);
      const rawName = parseTarText(header, 0, 100);
      const prefix =
        magic === "ustar" && version === "00"
          ? parseTarText(header, 345, 155)
          : "";
      const name =
        paxName !== null
          ? paxName
          : gnuName !== null
          ? gnuName
          : prefix
          ? prefix + "/" + rawName
          : rawName;
      paxName = null;
      paxSize = null;
      gnuName = null;
      const entryPath = name ? normalizeArchiveEntryName(name) : "";
      if (entryPath) {
        const type =
          typeflag === "5"
            ? "directory"
            : typeflag === "0" || typeflag === "7"
            ? "file"
            : "other";
        entries.push({
          entryPath,
          type,
          size,
          dataOffset,
        });
      }
      pos = dataOffset + paddedSize;
    }
    return {
      ok: true,
      entries,
      list: entries
        .filter((entry) => entry.type === "file")
        .map((entry) => ({
          entryPath: entry.entryPath,
          size: entry.size,
          fileName: path.posix.basename(entry.entryPath),
        })),
    };
  } finally {
    fs.closeSync(fd);
  }
};
const ensureTarIndex = (filePath) => {
  let fingerprint;
  try {
    const stat = fs.statSync(filePath);
    fingerprint = `${filePath}:${stat.size}:${stat.mtimeMs}`;
  } catch (e) {
    return Promise.resolve({ ok: false });
  }
  const cached = tarIndexCache.get(fingerprint);
  if (cached) {
    tarIndexCache.delete(fingerprint);
    tarIndexCache.set(fingerprint, cached);
    return Promise.resolve(cached);
  }
  const pending = tarIndexPending.get(fingerprint);
  if (pending) return pending;
  const promise = (async () => {
    let index;
    try {
      index = scanTarIndex(filePath, fs.statSync(filePath));
    } catch (e) {
      index = { ok: false };
    }
    tarIndexCache.set(fingerprint, index);
    if (tarIndexCache.size > TAR_INDEX_CACHE_MAX) {
      tarIndexCache.delete(tarIndexCache.keys().next().value);
    }
    tarIndexPending.delete(fingerprint);
    return index;
  })();
  tarIndexPending.set(fingerprint, promise);
  return promise;
};
// 按偏移 seek 直读提取指定条目；返回 null 表示无法处理（调用方回退流式解压）
const extractTarByOffsets = (filePath, index, wanted, baseDir) => {
  const selectAll = wanted === null;
  const selected = new Map();
  for (const entry of index.entries) {
    if (!selectAll && !wanted.has(entry.entryPath)) continue;
    // 同名条目取最后一个，与顺序解压"后写覆盖先写"的语义一致
    selected.set(entry.entryPath, entry);
  }
  if (!selectAll && selected.size !== wanted.size) return null;
  for (const entry of selected.values()) {
    if (entry.type !== "file" && entry.type !== "directory") return null;
  }
  const results = [];
  const writes = [];
  for (const entry of selected.values()) {
    const dest = ensureEntryInside(baseDir, entry.entryPath);
    if (entry.type === "directory") {
      fs.mkdirSync(dest, { recursive: true });
      continue;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    results.push(dest);
    if (entry.size === 0) {
      fs.writeFileSync(dest, Buffer.alloc(0));
      continue;
    }
    writes.push(
      new Promise((resolve, reject) => {
        const input = fs.createReadStream(filePath, {
          start: entry.dataOffset,
          end: entry.dataOffset + entry.size - 1,
        });
        const output = fs.createWriteStream(dest);
        input.on("error", reject);
        output.on("error", reject);
        output.on("close", resolve);
        input.pipe(output);
      })
    );
  }
  return Promise.all(writes).then(() => results);
};

module.exports = {
  normalizeArchiveEntryName,
  ensureEntryInside,
  scanTarIndex,
  ensureTarIndex,
  extractTarByOffsets,
};
