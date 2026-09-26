const fs = require("fs");
const path = require("path");
const yazl = require("yazl");
const yauzl = require("yauzl");

// 备份：把 dataPath 下的指定目录/文件打包为 zip（.tmp 先写后原子改名）。
// sendProgress(percent) 由调用方注入，用于向渲染进程转发进度。
const backupToPath = async (config, sendProgress) => {
  if (!config || typeof config !== "object") {
    throw new TypeError("Invalid backup config");
  }
  const { targetPath, fileName, dataPath, dirs, files } = config;
  if (
    [targetPath, dataPath].some((v) => typeof v !== "string" || !v) ||
    typeof fileName !== "string" ||
    !fileName ||
    !Array.isArray(dirs) ||
    !Array.isArray(files)
  ) {
    throw new TypeError("Invalid backup arguments");
  }
  // 校验 dirs/files 路径均位于 dataPath 之内，防止路径穿越
  const base = path.resolve(dataPath);
  const assertInside = (p) => {
    const resolved = path.resolve(p);
    const rel = path.relative(base, resolved);
    if (
      rel.startsWith(".." + path.sep) ||
      path.isAbsolute(rel) ||
      rel.split(path.sep).includes("..")
    ) {
      throw new Error("Backup source path is outside the data directory");
    }
    return resolved;
  };
  try {
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    const destinationPath = path.join(targetPath, fileName);
    const tempPath = destinationPath + ".tmp";
    await new Promise((resolve, reject) => {
      const zip = new yazl.ZipFile();
      zip.level = 6;
      const output = fs.createWriteStream(tempPath);
      let totalBytes = 0;
      let writtenBytes = 0;
      // 条目源文件由 yazl 内部以 createReadStream 读取，读写出错时 yazl 虽会
      // 触发 emit("error")，但 outputStream 的 "end" 不再走到，导致 promise
      // 永久悬挂、进度 toast 卡死。统一收集错误：完成后销毁输出流再 reject，
      // 主进程 catch 会清理 .tmp 并向渲染进程返回失败。
      const errored = (err) => {
        try {
          output.destroy();
        } catch (_) {}
        reject(err);
      };
      output.on("error", errored);
      zip.outputStream.on("error", errored);
      zip.on("error", errored);
      const finish = () => {
        output.end();
      };
      output.on("close", resolve);
      // 列出所有待打包的源文件并累计总字节数（用于进度估算）
      const entries = [];
      const collect = (zipDir, sourceDir) => {
        let direntNames;
        try {
          direntNames = fs.readdirSync(sourceDir, { withFileTypes: true });
        } catch (_) {
          return;
        }
        if (direntNames.length === 0) return;
        for (const entry of direntNames) {
          const sourcePath = path.join(sourceDir, entry.name);
          const entryZip = path.posix.join(zipDir, entry.name);
          if (entry.isDirectory()) {
            collect(entryZip, sourcePath);
          } else if (entry.isFile()) {
            try {
              totalBytes += fs.statSync(sourcePath).size;
            } catch (_) {}
            entries.push({ sourcePath, entryZip });
          }
        }
      };
      for (const dir of dirs) {
        const sourceDir = assertInside(path.join(dataPath, dir));
        if (fs.existsSync(sourceDir)) {
          zip.addEmptyDirectory(dir);
          collect(dir, sourceDir);
        }
      }
      for (const filePath of files) {
        const sourcePath = assertInside(
          path.resolve(dataPath, filePath.replace(/^[/\\]/, ""))
        );
        if (fs.existsSync(sourcePath)) {
          try {
            totalBytes += fs.statSync(sourcePath).size;
          } catch (_) {}
          entries.push({
            sourcePath,
            entryZip: path.posix.normalize(filePath.replace(/^[/\\]/, "")),
          });
        }
      }
      for (const entry of entries) {
        zip.addFile(entry.sourcePath, entry.entryZip);
      }
      zip.end();
      zip.outputStream.on("data", (chunk) => {
        writtenBytes += chunk.length;
      });
      zip.outputStream.on("end", () => {
        finish();
      });
      // 进度估算：zip.outputStream 无内建进度，按"已写入条目的源字节"
      // 与总字节数的比例上报（压缩前后差异不影响 UI 展示）
      zip.outputStream.pipe(output);
      const report = setInterval(() => {
        const percent = totalBytes
          ? Math.min(100, Math.round((writtenBytes / totalBytes) * 100))
          : 100;
        sendProgress(percent);
      }, 100);
      zip.outputStream.on("end", () => {
        clearInterval(report);
      });
    });
    let tempStat;
    try {
      tempStat = fs.statSync(tempPath);
    } catch (_) {
      throw new Error("Backup output file was not created");
    }
    if (fs.existsSync(destinationPath)) {
      fs.unlinkSync(destinationPath);
    }
    fs.renameSync(tempPath, destinationPath);
    sendProgress(100);
    return { ok: true, size: tempStat.size };
  } catch (error) {
    try {
      const tempPath = path.join(targetPath, fileName) + ".tmp";
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (_) {}
    const message = error instanceof Error ? error.message : String(error);
    console.error("backup-path failed:", message);
    return { ok: false, error: message };
  }
};

// 流式解压恢复：用 yauzl 逐条目 openReadStream，避免把整个 zip 读入内存。
// 资产文件（book/cover/dict/background/font/snapshot）在主进程直接流式写盘，
// config 类文件（config/*.db、config.json、sync.json）回传渲染进程处理：
// .db 经 sql.js 解析后与本地记录合并写入，json 写入 ConfigService。
const restoreFromPath = async (config, sendProgress) => {
  if (!config || typeof config !== "object") {
    throw new TypeError("Invalid restore config");
  }
  const { filePath, dataPath } = config;
  if (
    typeof filePath !== "string" ||
    !filePath ||
    typeof dataPath !== "string" ||
    !dataPath
  ) {
    throw new TypeError("Invalid restore arguments");
  }
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: "Backup file not found" };
  }
  const base = path.resolve(dataPath);
  const assertInside = (p) => {
    const resolved = path.resolve(p);
    const rel = path.relative(base, resolved);
    if (
      rel.startsWith(".." + path.sep) ||
      path.isAbsolute(rel) ||
      rel.split(path.sep).includes("..")
    ) {
      throw new Error(
        "Restore destination path is outside the data directory"
      );
    }
    return resolved;
  };
  const ASSET_PREFIXES = [
    "book/",
    "cover/",
    "dict/",
    "background/",
    "font/",
    "snapshot/",
  ];
  const isConfigFile = (name) => {
    if (!name.startsWith("config/")) return false;
    const rest = name.slice("config/".length);
    if (rest.includes("/")) return false;
    return (
      rest.endsWith(".db") || rest === "config.json" || rest === "sync.json"
    );
  };
  const isAssetFile = (name) =>
    ASSET_PREFIXES.some((prefix) => name.startsWith(prefix));
  const isFileEntry = (entry) => !/\/$/.test(entry.fileName);

  // 用 yauzl 回调式 API 遍历（其 eachEntry() 迭代器与 FdSlicer 的 ref/unref
  // 时序存在冲突，遍历结束后 fd 会被提前关闭，故不使用 for await 形式）。
  const scanEntries = () =>
    new Promise((resolve, reject) => {
      yauzl.fromFd(
        fs.openSync(filePath, "r"),
        { lazyEntries: true, autoClose: true },
        (err, zf) => {
          if (err) return reject(err);
          let hasNewConfig = false;
          let totalEntries = 0;
          zf.on("entry", (entry) => {
            if (entry.fileName === "config/config.json") hasNewConfig = true;
            totalEntries++;
            zf.readEntry();
          });
          zf.on("end", () => resolve({ hasNewConfig, totalEntries }));
          zf.on("error", reject);
          zf.readEntry();
        }
      );
    });

  let scanResult;
  try {
    scanResult = await scanEntries();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
  if (!scanResult.hasNewConfig) {
    return { ok: false, isNewBackup: false };
  }
  const totalEntries = scanResult.totalEntries;

  // 第二遍：逐条目 openReadStream 流式处理。
  const configBuffers = [];
  let processed = 0;
  const processAllEntries = () =>
    new Promise((resolve, reject) => {
      yauzl.fromFd(
        fs.openSync(filePath, "r"),
        { lazyEntries: true, autoClose: true },
        (err, zf) => {
          if (err) return reject(err);
          const advance = () => {
            processed++;
            sendProgress(
              Math.round((processed / Math.max(totalEntries, 1)) * 100)
            );
            zf.readEntry();
          };
          zf.on("entry", (entry) => {
            const name = entry.fileName;
            if (!isFileEntry(entry)) {
              // 目录条目：在主进程创建对应目录。若目标路径被一个异常空文件占住
              // （历史残留），先删除该文件再建目录，避免后续写入 ENOENT。
              if (isAssetFile(name) || name.startsWith("config/")) {
                let dirDest;
                try {
                  dirDest = assertInside(
                    path.join(dataPath, name.replace(/\/$/, ""))
                  );
                } catch (e3) {
                  return reject(e3);
                }
                try {
                  if (
                    fs.existsSync(dirDest) &&
                    !fs.statSync(dirDest).isDirectory()
                  ) {
                    fs.unlinkSync(dirDest);
                  }
                  fs.mkdirSync(dirDest, { recursive: true });
                } catch (e3) {
                  return reject(e3);
                }
              }
              advance();
              return;
            }
            zf.openReadStream(entry, (e2, readStream) => {
              if (e2) return reject(e2);
              if (isAssetFile(name)) {
                // 流式写盘，不进内存
                let destination;
                try {
                  destination = assertInside(path.join(dataPath, name));
                } catch (e3) {
                  return reject(e3);
                }
                const directory = path.dirname(destination);
                try {
                  if (
                    fs.existsSync(directory) &&
                    !fs.statSync(directory).isDirectory()
                  ) {
                    fs.unlinkSync(directory);
                  }
                  fs.mkdirSync(directory, { recursive: true });
                } catch (e3) {
                  return reject(e3);
                }
                const output = fs.createWriteStream(destination);
                output.on("error", reject);
                readStream.on("error", reject);
                output.on("close", advance);
                readStream.pipe(output);
              } else if (isConfigFile(name)) {
                // config 类文件（*.db / config.json / sync.json）累积为 Buffer
                // 回传渲染进程处理：.db 经 sql.js 解析合并，json 写入 ConfigService
                const chunks = [];
                readStream.on("data", (chunk) => chunks.push(chunk));
                readStream.on("error", reject);
                readStream.on("end", () => {
                  const buf = Buffer.concat(chunks);
                  configBuffers.push({
                    name,
                    buffer: buf.buffer.slice(
                      buf.byteOffset,
                      buf.byteOffset + buf.byteLength
                    ),
                  });
                  advance();
                });
              } else {
                readStream.resume();
                readStream.on("end", advance);
                readStream.on("error", reject);
              }
            });
          });
          zf.on("end", resolve);
          zf.on("error", reject);
          zf.readEntry();
        }
      );
    });

  try {
    await processAllEntries();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("restore-path failed:", message);
    return { ok: false, error: message };
  }
  sendProgress(100);
  return {
    ok: true,
    isNewBackup: true,
    configFiles: configBuffers,
  };
};

module.exports = { backupToPath, restoreFromPath };
