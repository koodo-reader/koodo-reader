const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 配置信息
const UPLOAD_DIR = path.resolve('./uploads'); // 使用绝对路径
const PORT = process.env.PORT || 8000;
const VALID_CREDENTIALS = {
  username: process.env.SERVER_USERNAME || 'admin',
  password: process.env.SERVER_PASSWORD || 'securePass123'
};

// 验证必要的环境变量
if (!process.env.SERVER_USERNAME || !process.env.SERVER_PASSWORD) {
  console.warn('Warning: Using default credentials. Set SERVER_USERNAME and SERVER_PASSWORD environment variables for production.');
}

// 创建上传目录（如果不存在）
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
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
  const boundary = req.headers['content-type']?.split('=')[1];
  if (!boundary) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Invalid Content-Type');
  }

  let body = [];
  req.on('data', (chunk) => body.push(chunk));
  req.on('end', () => {
    try {
      const buffer = Buffer.concat(body);
      const parts = parseMultipart(buffer, boundary);

      if (!parts.file || !parts.filename) {
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

// 解析multipart数据
function parseMultipart(buffer, boundary) {
  const result = {};
  const boundaryPrefix = `--${boundary}`;
  const sections = buffer.toString('binary').split(boundaryPrefix);

  for (const section of sections) {
    if (!section.trim() || section.includes('--')) continue;

    const headerEnd = section.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const headers = section.substring(0, headerEnd);
    const content = section.substring(headerEnd + 4).trim();

    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);

    if (nameMatch) {
      const name = nameMatch[1];
      if (filenameMatch) {
        result.filename = filenameMatch[1];
        result.file = Buffer.from(content, 'binary');
      } else {
        result[name] = content;
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

// 启动服务器
server.listen(PORT, () => {
  console.log(`Secure File Server running at http://localhost:${PORT}`);
  console.log(`Username: ${VALID_CREDENTIALS.username}`);
  console.log('Password: [HIDDEN FOR SECURITY]');
});