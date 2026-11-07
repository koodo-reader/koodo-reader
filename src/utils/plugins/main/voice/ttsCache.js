// 听书音频持久缓存工具（主进程）
// 参考 koodo-reader-expo 的 getTTSAudioKey / TTS_CACHE_DIR 设计：
// 缓存 key 为内容哈希（相同文本/语速/音色配置命中同一文件），文件名即 key，
// 支持跨会话复用；目录仅在设置-数据「清理听书缓存」或「清除全部数据」时清除
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const getTTSAudioKey = (payload) =>
  crypto
    .createHash("md5")
    .update(JSON.stringify(payload || {}))
    .digest("hex");

const isTTSAudioKey = (key) =>
  typeof key === "string" && /^[a-f0-9]{32}$/.test(key);

const getTTSDirPath = (dirPath) => path.join(dirPath, "tts");

const ensureTTSDir = (dirPath) => {
  const ttsDir = getTTSDirPath(dirPath);
  if (!fs.existsSync(ttsDir)) {
    fs.mkdirSync(ttsDir, { recursive: true });
  }
  return ttsDir;
};

// 根据音频内容嗅探扩展名
const detectAudioExt = (buffer) => {
  if (!buffer || buffer.length < 12) return "";
  const head = buffer.subarray(0, 12);
  if (head[0] === 0xff && (head[1] & 0xe0) === 0xe0) return "mp3";
  const ascii = head.toString("latin1");
  if (ascii.startsWith("ID3")) return "mp3";
  if (ascii.startsWith("RIFF")) return "wav";
  if (ascii.startsWith("OggS")) return "ogg";
  if (ascii.startsWith("fLaC")) return "flac";
  if (head.toString("latin1", 4, 8) === "ftyp") return "m4a";
  return "";
};

// 扫描 tts 目录，返回 key -> 文件路径 的索引列表缓存
const ttsIndexCache = new Map();
const getTTSAudioIndex = (dirPath) => {
  let index = ttsIndexCache.get(dirPath);
  if (index) {
    return index;
  }
  index = new Map();
  const ttsDir = getTTSDirPath(dirPath);
  if (fs.existsSync(ttsDir)) {
    for (const name of fs.readdirSync(ttsDir)) {
      const dotIndex = name.lastIndexOf(".");
      if (dotIndex <= 0) continue;
      const key = name.slice(0, dotIndex);
      if (!isTTSAudioKey(key)) continue;
      index.set(key, path.join(ttsDir, name));
    }
  }
  ttsIndexCache.set(dirPath, index);
  return index;
};

const resetTTSAudioIndex = (dirPath) => {
  if (dirPath) {
    ttsIndexCache.delete(dirPath);
  } else {
    ttsIndexCache.clear();
  }
};

// 命中本地缓存则返回文件绝对路径，否则返回空字符串
const findCachedTTSAudio = (dirPath, key) => {
  if (!isTTSAudioKey(key)) return "";
  const file = getTTSAudioIndex(dirPath).get(key);
  if (file && fs.existsSync(file)) {
    return file;
  }
  return "";
};

// 按内容哈希写入音频文件（扩展名由内容嗅探决定），返回文件绝对路径
const saveTTSAudio = (dirPath, key, buffer) => {
  if (!isTTSAudioKey(key) || !Buffer.isBuffer(buffer)) {
    throw new Error("Invalid TTS audio cache request");
  }
  const ext = detectAudioExt(buffer) || "mp3";
  const audioPath = path.join(ensureTTSDir(dirPath), `${key}.${ext}`);
  fs.writeFileSync(audioPath, buffer);
  getTTSAudioIndex(dirPath).set(key, audioPath);
  return audioPath;
};

// 为插件按内容哈希生成音频文件路径（写入方使用，扩展名由插件约定）
const getTTSAudioPath = (voiceIdentifier, text, speed, config, dirPath, ext) => {
  const audioName =
    getTTSAudioKey({ text, speed, ...config, voiceIdentifier }) +
    (ext || ".mp3");
  return path.join(getTTSDirPath(dirPath), audioName);
};

module.exports = {
  getTTSAudioKey,
  isTTSAudioKey,
  getTTSDirPath,
  ensureTTSDir,
  detectAudioExt,
  getTTSAudioIndex,
  resetTTSAudioIndex,
  findCachedTTSAudio,
  saveTTSAudio,
  getTTSAudioPath,
};
