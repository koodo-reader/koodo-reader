const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

// 从 Docker Secrets 读取密码的函数
function getDockerSecret(secretName) {
  try {
    const secretPath = `/run/secrets/${secretName}`;
    if (fs.existsSync(secretPath)) {
      return fs.readFileSync(secretPath, "utf8").trim();
    }
  } catch (err) {
    console.warn(`Failed to read Docker secret '${secretName}':`, err.message);
  }
  return null;
}

// 配置信息
const UPLOAD_DIR = path.resolve("./uploads"); // 使用绝对路径
const PORT = process.env.PORT || 8080;
const SERVER_ENABLED = process.env.ENABLE_HTTP_SERVER === "true"; // 新增：控制服务器是否启用
// 优先从 Docker Secrets 读取密码，如果没有则回退到环境变量
const SERVER_PASSWORD_FILE = process.env.SERVER_PASSWORD_FILE || "my_secret";
const SERVER_PASSWORD =
  getDockerSecret(SERVER_PASSWORD_FILE) ||
  process.env.SERVER_PASSWORD ||
  "securePass123";
const VALID_CREDENTIALS = {
  username: process.env.SERVER_USERNAME || "admin",
  password: SERVER_PASSWORD,
};

// CORS 允许的来源列表（逗号分隔）。默认不允许任何跨域来源，
// 仅允许同源（无 Origin 头）请求，以避免 CSRF/凭据滥用。
// 例如：ALLOWED_ORIGINS="https://reader.example.com,https://app.example.com"
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter((o) => o.length > 0);

// 验证密码来源
if (getDockerSecret(SERVER_PASSWORD_FILE)) {
  console.info("Using password from Docker Secret");
} else if (process.env.SERVER_PASSWORD) {
  console.warn("Using password from environment variable (less secure)");
} else {
  console.warn(
    "Warning: Using default password. Set Docker Secret or SERVER_PASSWORD environment variable for production."
  );
}

if (!process.env.SERVER_USERNAME) {
  console.warn(
    "Warning: Using default username. Set SERVER_USERNAME environment variable for production."
  );
}

if (ALLOWED_ORIGINS.length === 0) {
  console.warn(
    "Warning: No ALLOWED_ORIGINS configured. Cross-origin requests will be denied. " +
      "Set ALLOWED_ORIGINS to a comma-separated list of trusted origins if needed."
  );
}

// 检查服务器是否启用
if (!SERVER_ENABLED) {
  console.info(
    "HTTP Server is disabled. Set ENABLE_HTTP_SERVER=true to enable it."
  );
  process.exit(0);
}

// 创建上传目录（如果不存在）
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 设置安全的 CORS 头部：
// - 仅当请求 Origin 在白名单中时回显该 Origin，并允许凭据
// - 否则不发送 ACAO 头，浏览器会阻止跨域响应读取
// 永远不会同时使用通配符 "*" 与 Allow-Credentials: true。
function applyCorsHeaders(req, res) {
  const origin = req.headers["origin"];
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    return true;
  }
  return false;
}

const server = http.createServer((req, res) => {
  const origin = req.headers["origin"];
  const corsAllowed = applyCorsHeaders(req, res);

  // 处理预检请求
  if (req.method === "OPTIONS") {
    if (origin && !corsAllowed) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      return res.end("Origin not allowed");
    }
    res.writeHead(204);
    return res.end();
  }

  // 对于带 Origin 的实际请求，若不在白名单则拒绝，
  // 防止凭据被跨站请求滥用 (CSRF / CWE-942)。
  if (origin && !corsAllowed) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    return res.end("Origin not allowed");
  }

  // 认证检查
  if (!authenticate(req)) {
    res.writeHead(401, {
      "WWW-Authenticate": 'Basic realm="Secure File Server"',
      "Content-Type": "text/plain",
    });
    return res.end("Unauthorized");
  }

  // 路由处理
  const parsedUrl = url.parse(req.url, true);

  if (req.method === "POST" && parsedUrl.pathname === "/upload") {
    handleUpload(req, res, parsedUrl.query.dir || "");
  } else if (req.method === "GET" && parsedUrl.pathname === "/download") {
    handleDownload(req, res, parsedUrl.query.dir || "");
  } else if (req.method === "DELETE" && parsedUrl.pathname === "/delete") {
    handleDelete(req, res, parsedUrl.query.dir || "");
  } else if (req.method === "GET" && parsedUrl.pathname === "/list") {
    handleList(req, res, parsedUrl.query.dir || "");
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

// 基本认证验证
function authenticate(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return false;

  const [scheme, credentials] = authHeader.split(" ");
  if (scheme !== "Basic") return false;

  const [username, password] = Buffer.from(credentials, "base64")
    .toString()
    .split(":");

  return (
    username === VALID_CREDENTIALS.username &&
    password === VALID_CREDENTIALS.password
  );
}

// 安全处理文件名
function sanitizeFilename(originalName) {
  // 移除路径部分，只保留文件名
  const base = path.basename(originalName);

  // 替换非法字符（Windows文件系统非法字符）
  return base.replace(/[\\/:*?"<>|]/g, "_");
}

// 安全路径解析（防止目录遍历攻击）
function resolveSafePath(...pathSegments) {
  const targetPath = path.resolve(UPLOAD_DIR, ...pathSegments);
  const relativePath = path.relative(UPLOAD_DIR, targetPath);

  // 检查路径是否试图访问UPLOAD_DIR之外
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Invalid path");
  }

  return targetPath;
}

// 文件上传处理
function handleUpload(req, res, dirParam) {
  const contentType = req.headers["content-type"];
  if (!contentType || !contentType.includes("multipart/form-data")) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Invalid Content-Type. Expected multipart/form-data");
  }

  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Missing boundary in Content-Type");
  }

  const boundary = boundaryMatch[1];
  let body = [];

  req.on("data", (chunk) => body.push(chunk));
  req.on("end", () => {
    try {
      const buffer = Buffer.concat(body);
      const parts = parseMultipart(buffer, boundary);

      if (!parts.file || !parts.filename) {
        console.info("Parsed parts:", Object.keys(parts)); // 调试信息
        throw new Error("No valid file uploaded");
      }

      // 安全处理文件名
      const safeFilename = sanitizeFilename(parts.filename);

      // 验证文件名
      if (!safeFilename || safeFilename === "." || safeFilename === "..") {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("Invalid filename");
      }

      // 解析并验证目标路径
      const targetDir = resolveSafePath(dirParam);
      const filePath = resolveSafePath(dirParam, safeFilename);

      // 确保目标目录存在
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.writeFile(filePath, parts.file, (err) => {
        if (err) {
          console.error("File write error:", err);
          res.writeHead(500, { "Content-Type": "text/plain" });
          return res.end("Internal Server Error");
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            filename: safeFilename,
            directory: dirParam,
            message: "File uploaded successfully",
          })
        );
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end(err.message);
    }
  });
}

// 解析multipart数据 - 改进版本
function parseMultipart(buffer, boundary) {
  const result = {};
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = [];

  let start = 0;
  let end = buffer.indexOf(boundaryBuffer, start);

  while (end !== -1) {
    if (start !== 0) {
      // 跳过第一个边界前的内容
      parts.push(buffer.slice(start, end));
    }
    start = end + boundaryBuffer.length;
    end = buffer.indexOf(boundaryBuffer, start);
  }

  for (const part of parts) {
    if (part.length === 0) continue;

    // 查找头部结束位置
    const headerEndIndex = part.indexOf("\r\n\r\n");
    if (headerEndIndex === -1) continue;

    const headers = part.slice(0, headerEndIndex).toString();
    const content = part.slice(headerEndIndex + 4);

    // 移除结尾的 \r\n
    const actualContent = content.slice(0, content.length - 2);

    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);

    if (nameMatch) {
      const name = nameMatch[1];
      if (filenameMatch && filenameMatch[1]) {
        result.filename = filenameMatch[1];
        result.file = actualContent;
        console.info(
          `Found file: ${result.filename}, size: ${actualContent.length} bytes`
        ); // 调试信息
      } else {
        result[name] = actualContent.toString();
      }
    }
  }

  return result;
}
// 文件下载处理
function handleDownload(req, res, dirParam) {
  try {
    const parsedUrl = url.parse(req.url, true);
    const filename = parsedUrl.query.filename;

    if (!filename) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Missing filename parameter");
    }

    // 安全处理文件名
    const safeFilename = sanitizeFilename(filename);

    // 验证文件名
    if (!safeFilename || safeFilename === "." || safeFilename === "..") {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Invalid filename");
    }

    // 解析并验证文件路径
    const filePath = resolveSafePath(dirParam, safeFilename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("File not found");
    }

    const stat = fs.statSync(filePath);

    // 设置下载文件名
    const encodedFilename = encodeURIComponent(safeFilename);
    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Content-Length": stat.size,
      "Content-Disposition": `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
    });

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("Download error:", err);
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(err.message);
  }
}
function handleDelete(req, res, dirParam) {
  try {
    const parsedUrl = url.parse(req.url, true);
    const filename = parsedUrl.query.filename;

    if (!filename) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Missing filename parameter");
    }

    // 安全处理文件名
    const safeFilename = sanitizeFilename(filename);

    // 验证文件名
    if (!safeFilename || safeFilename === "." || safeFilename === "..") {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Invalid filename");
    }

    // 解析并验证文件路径
    const filePath = resolveSafePath(dirParam, safeFilename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("File not found");
    }

    // 检查是否为文件（非目录）
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Target is not a file");
    }

    // 删除文件
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("File delete error:", err);
        res.writeHead(500, { "Content-Type": "text/plain" });
        return res.end("Internal Server Error");
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          filename: safeFilename,
          directory: dirParam,
          message: "File deleted successfully",
        })
      );
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(err.message);
  }
}

// 目录列表处理
function handleList(req, res, dirParam) {
  try {
    // 解析并验证目录路径
    const targetDir = resolveSafePath(dirParam);

    // 检查目录是否存在
    if (!fs.existsSync(targetDir)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Directory not found");
    }

    // 检查是否为目录
    const stat = fs.statSync(targetDir);
    if (!stat.isDirectory()) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Target is not a directory");
    }

    // 读取目录内容
    fs.readdir(targetDir, { withFileTypes: true }, (err, entries) => {
      if (err) {
        console.error("Directory read error:", err);
        res.writeHead(500, { "Content-Type": "text/plain" });
        return res.end("Internal Server Error");
      }

      const fileList = entries.map((entry) => {
        const stat = fs.statSync(path.join(targetDir, entry.name));
        return {
          name: entry.name,
          type: entry.isDirectory() ? "directory" : "file",
          size: entry.isFile() ? stat.size : null,
          modifiedTime: stat.mtime.toISOString(),
          createdTime: stat.birthtime.toISOString(),
        };
      });

      // 按类型和名称排序（目录在前，然后按名称排序）
      fileList.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          directory: dirParam,
          files: fileList,
          totalCount: fileList.length,
        })
      );
    });
  } catch (err) {
    console.error("List error:", err);
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(err.message);
  }
}

// 启动服务器
server.listen(PORT, () => {
  console.info(`Secure File Server running at http://localhost:${PORT}`);
  console.info(`Username: ${VALID_CREDENTIALS.username}`);
  console.info("Password: [HIDDEN FOR SECURITY]");
});
