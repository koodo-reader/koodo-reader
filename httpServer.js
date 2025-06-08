const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 配置信息
const UPLOAD_DIR = path.resolve('./uploads'); // 使用绝对路径
const PORT = process.env.PORT || 8080;
const SERVER_ENABLED = process.env.ENABLE_HTTP_SERVER === 'true'; // 新增：控制服务器是否启用
const VALID_CREDENTIALS = {
  username: process.env.SERVER_USERNAME || 'admin',
  password: process.env.SERVER_PASSWORD || 'securePass123'
};

// 验证必要的环境变量
if (!process.env.SERVER_USERNAME || !process.env.SERVER_PASSWORD) {
  console.warn('Warning: Using default credentials. Set SERVER_USERNAME and SERVER_PASSWORD environment variables for production.');
}

// 检查服务器是否启用
if (!SERVER_ENABLED) {
  console.log('HTTP Server is disabled. Set ENABLE_HTTP_SERVER=true to enable it.');
  process.exit(0);
}

// 创建上传目录（如果不存在）
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }
  // 认证检查
  if (!authenticate(req)) {
    res.writeHead(401, {
      'WWW-Authenticate': 'Basic realm="Secure File Server"',
      'Content-Type': 'text/plain'
    });
    return res.end('Unauthorized');
  }

  // 路由处理
  const parsedUrl = url.parse(req.url, true);

  if (req.method === 'POST' && parsedUrl.pathname === '/upload') {
    handleUpload(req, res, parsedUrl.query.dir || '');
  } else if (req.method === 'GET' && parsedUrl.pathname === '/download') {
    handleDownload(req, res, parsedUrl.query.dir || '');
  } else if (req.method === 'DELETE' && parsedUrl.pathname === '/delete') {
    handleDelete(req, res, parsedUrl.query.dir || '');
  } else if (req.method === 'GET' && parsedUrl.pathname === '/list') {
    handleList(req, res, parsedUrl.query.dir || '');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// 基本认证验证
function authenticate(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return false;

  const [scheme, credentials] = authHeader.split(' ');
  if (scheme !== 'Basic') return false;

  const [username, password] = Buffer.from(credentials, 'base64')
    .toString()
    .split(':');

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
  return base.replace(/[\\/:*?"<>|]/g, '_');
}

// 安全路径解析（防止目录遍历攻击）
function resolveSafePath(...pathSegments) {
  const targetPath = path.resolve(UPLOAD_DIR, ...pathSegments);
  const relativePath = path.relative(UPLOAD_DIR, targetPath);

  // 检查路径是否试图访问UPLOAD_DIR之外
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Invalid path');
  }

  return targetPath;
}

// 文件上传处理
function handleUpload(req, res, dirParam) {
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('multipart/form-data')) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Invalid Content-Type. Expected multipart/form-data');
  }

  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Missing boundary in Content-Type');
  }

  const boundary = boundaryMatch[1];
  let body = [];

  req.on('data', (chunk) => body.push(chunk));
  req.on('end', () => {
    try {
      const buffer = Buffer.concat(body);
      const parts = parseMultipart(buffer, boundary);

      if (!parts.file || !parts.filename) {
        console.log('Parsed parts:', Object.keys(parts)); // 调试信息
        throw new Error('No valid file uploaded');
      }

      // 安全处理文件名
      const safeFilename = sanitizeFilename(parts.filename);

      // 验证文件名
      if (!safeFilename || safeFilename === '.' || safeFilename === '..') {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end('Invalid filename');
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
          console.error('File write error:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          return res.end('Internal Server Error');
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          filename: safeFilename,
          directory: dirParam,
          message: 'File uploaded successfully'
        }));
      });
    } catch (err) {
      console.error('Upload error:', err);
      res.writeHead(400, { 'Content-Type': 'text/plain' });
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
    if (start !== 0) { // 跳过第一个边界前的内容
      parts.push(buffer.slice(start, end));
    }
    start = end + boundaryBuffer.length;
    end = buffer.indexOf(boundaryBuffer, start);
  }

  for (const part of parts) {
    if (part.length === 0) continue;

    // 查找头部结束位置
    const headerEndIndex = part.indexOf('\r\n\r\n');
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
        console.log(`Found file: ${result.filename}, size: ${actualContent.length} bytes`); // 调试信息
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
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Missing filename parameter');
    }

    // 安全处理文件名
    const safeFilename = sanitizeFilename(filename);

    // 验证文件名
    if (!safeFilename || safeFilename === '.' || safeFilename === '..') {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Invalid filename');
    }

    // 解析并验证文件路径
    const filePath = resolveSafePath(dirParam, safeFilename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('File not found');
    }

    const stat = fs.statSync(filePath);

    // 设置下载文件名
    const encodedFilename = encodeURIComponent(safeFilename);
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': stat.size,
      'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
    });

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end(err.message);
  }
}
function handleDelete(req, res, dirParam) {
  try {
    const parsedUrl = url.parse(req.url, true);
    const filename = parsedUrl.query.filename;

    if (!filename) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Missing filename parameter');
    }

    // 安全处理文件名
    const safeFilename = sanitizeFilename(filename);

    // 验证文件名
    if (!safeFilename || safeFilename === '.' || safeFilename === '..') {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Invalid filename');
    }

    // 解析并验证文件路径
    const filePath = resolveSafePath(dirParam, safeFilename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('File not found');
    }

    // 检查是否为文件（非目录）
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Target is not a file');
    }

    // 删除文件
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('File delete error:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Internal Server Error');
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        filename: safeFilename,
        directory: dirParam,
        message: 'File deleted successfully'
      }));
    });
  } catch (err) {
    console.error('Delete error:', err);
    res.writeHead(400, { 'Content-Type': 'text/plain' });
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
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Directory not found');
    }

    // 检查是否为目录
    const stat = fs.statSync(targetDir);
    if (!stat.isDirectory()) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Target is not a directory');
    }

    // 读取目录内容
    fs.readdir(targetDir, { withFileTypes: true }, (err, entries) => {
      if (err) {
        console.error('Directory read error:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Internal Server Error');
      }

      const fileList = entries.map(entry => {
        const stat = fs.statSync(path.join(targetDir, entry.name));
        return {
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: entry.isFile() ? stat.size : null,
          modifiedTime: stat.mtime.toISOString(),
          createdTime: stat.birthtime.toISOString()
        };
      });

      // 按类型和名称排序（目录在前，然后按名称排序）
      fileList.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        directory: dirParam,
        files: fileList,
        totalCount: fileList.length
      }));
    });
  } catch (err) {
    console.error('List error:', err);
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end(err.message);
  }
}

// 启动服务器
server.listen(PORT, () => {
  console.log(`Secure File Server running at http://localhost:${PORT}`);
  console.log(`Username: ${VALID_CREDENTIALS.username}`);
  console.log('Password: [HIDDEN FOR SECURITY]');
});