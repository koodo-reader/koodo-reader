const http = require('http');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = './uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/upload') {
    handleUpload(req, res);
  } else if (req.method === 'GET' && req.url.startsWith('/download')) {
    handleDownload(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

function handleUpload(req, res) {
  const boundary = req.headers['content-type']
    ? req.headers['content-type'].split('=')[1]
    : null;

  if (!boundary) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Invalid Content-Type');
  }

  let body = [];
  req.on('data', (chunk) => body.push(chunk));
  req.on('end', () => {
    const buffer = Buffer.concat(body);
    const parts = parseMultipart(buffer, boundary);

    if (!parts.file) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('No file uploaded');
    }

    const filePath = path.join(UPLOAD_DIR, parts.filename || 'uploaded_file');
    fs.writeFile(filePath, parts.file, (err) => {
      if (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Internal Server Error');
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`File uploaded successfully: ${parts.filename}`);
    });
  });
}

function parseMultipart(buffer, boundary) {
  const result = {};
  const boundaryPrefix = '--' + boundary;
  const boundaryEnd = boundaryPrefix + '--';

  let start = buffer.indexOf(boundaryPrefix) + boundaryPrefix.length + 2;
  let end = buffer.indexOf(boundaryPrefix, start);

  while (start < end && end !== -1) {
    const section = buffer.slice(start, end);
    const headerEnd = section.indexOf('\r\n\r\n');

    if (headerEnd === -1) continue;

    const headers = section.slice(0, headerEnd).toString();
    const content = section.slice(headerEnd + 4);

    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);

    if (nameMatch) {
      const name = nameMatch[1];
      if (filenameMatch) {
        result.filename = filenameMatch[1];
        result.file = content;
      } else {
        result[name] = content.toString();
      }
    }

    start = end + boundaryPrefix.length + 2;
    end = buffer.indexOf(boundaryPrefix, start);
  }

  return result;
}

function handleDownload(req, res) {
  const urlParams = new URL(req.url, 'http://localhost').searchParams;
  const filename = urlParams.get('filename');

  if (!filename) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Missing filename parameter');
  }

  // 防止目录遍历攻击
  const safeFilename = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, safeFilename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('File not found');
    }

    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': stat.size,
      'Content-Disposition': `attachment; filename=${safeFilename}`
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});